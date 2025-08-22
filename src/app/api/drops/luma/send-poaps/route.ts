import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchLumaGuests } from "@/lib/luma-cookie";
import nodemailer from "nodemailer";

interface SendPOAPsRequest {
  dropId: string;
  checkedInOnly?: boolean;
  testEmail?: string; // For testing with a single email
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SendPOAPsRequest = await request.json();
    const { dropId, checkedInOnly = true, testEmail } = body;

    // Get drop details
    const drop = await prisma.drop.findFirst({
      where: {
        id: dropId,
        userId: session.user.id,
        platform: 'luma'
      }
    });

    if (!drop || !drop.lumaEventId) {
      return NextResponse.json({ error: "Drop not found" }, { status: 404 });
    }

    // Check SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ 
        error: "Email service not configured. Please contact admin." 
      }, { status: 503 });
    }

    // Get guests from Luma
    const allGuests = await fetchLumaGuests(drop.lumaEventId);
    
    // Filter guests
    let guests = allGuests;
    if (checkedInOnly) {
      guests = guests.filter(guest => guest.checked_in_at !== null);
    }

    // If test email provided, only send to that email
    if (testEmail) {
      const testGuest = guests.find(g => g.email === testEmail);
      if (!testGuest) {
        return NextResponse.json({ 
          error: "Test email not found in guest list" 
        }, { status: 404 });
      }
      guests = [testGuest];
    }

    // Get already delivered POAPs
    const existingDeliveries = await prisma.lumaDelivery.findMany({
      where: { dropId },
      select: { guestId: true }
    });
    const deliveredGuests = new Set(existingDeliveries.map(d => d.guestId));

    // Filter out already delivered
    const guestsToSend = guests.filter(guest => !deliveredGuests.has(guest.api_id));

    if (guestsToSend.length === 0) {
      return NextResponse.json({ 
        message: "No new guests to send POAPs to",
        sent: 0
      });
    }

    // Get POAP event details for the email
    const poapResponse = await fetch(
      `${process.env.NEXT_PUBLIC_FRAME_URL || 'http://localhost:3000'}/api/poap/validate-event?eventId=${drop.poapEventId}`
    );
    const poapData = await poapResponse.json();
    const eventName = poapData.event?.name || `Event #${drop.poapEventId}`;

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send emails and create delivery records
    const results = await Promise.allSettled(
      guestsToSend.map(async (guest) => {
        try {
          // Generate unique POAP link for this guest
          const poapLink = `${process.env.NEXT_PUBLIC_FRAME_URL || 'https://social.poap.studio'}/share/${drop.slug}?guest=${encodeURIComponent(guest.email)}`;

          // Replace variables in email template
          const emailSubject = (drop.emailSubject || "Your POAP for {{eventName}}")
            .replace(/{{eventName}}/g, eventName);

          const emailBody = (drop.emailBody || `Hi {{name}},\n\nThank you for attending {{eventName}}!\n\nHere's your exclusive POAP: {{poapLink}}`)
            .replace(/{{name}}/g, guest.name)
            .replace(/{{eventName}}/g, eventName)
            .replace(/{{poapLink}}/g, poapLink);

          // Send email
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: guest.email,
            subject: emailSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                ${emailBody.split('\n').map(line => `<p>${line}</p>`).join('')}
                
                <div style="margin: 30px 0;">
                  <a href="${poapLink}" style="display: inline-block; background-color: #db2777; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Claim Your POAP
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
                
                <p style="color: #666; font-size: 14px;">
                  Powered by <a href="https://poap.xyz" style="color: #db2777;">POAP</a>
                </p>
              </div>
            `,
          });

          // Create delivery record
          await prisma.lumaDelivery.create({
            data: {
              dropId,
              guestId: guest.api_id,
              email: guest.email,
              name: guest.name,
              poapLink,
              checkedInAt: guest.checked_in_at ? new Date(guest.checked_in_at) : null
            }
          });

          return { success: true, email: guest.email };
        } catch (error) {
          console.error(`Failed to send POAP to ${guest.email}:`, error);
          return { success: false, email: guest.email, error };
        }
      })
    );

    // Count successes and failures
    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    return NextResponse.json({
      message: `POAPs sent successfully`,
      sent,
      failed,
      total: guestsToSend.length
    });

  } catch (error: any) {
    console.error("Error sending POAPs:", error);
    
    if (error.message.includes('No Luma cookie')) {
      return NextResponse.json({ 
        error: "Luma authentication expired. Please contact admin." 
      }, { status: 503 });
    }

    return NextResponse.json(
      { error: "Failed to send POAPs" },
      { status: 500 }
    );
  }
}