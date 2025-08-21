import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("Email request received from:", email);
      console.log("SMTP not configured - email would be sent to sebastian@poap.fr");
      
      // In production without SMTP, we'll just log and return success
      // This way the user experience is not broken
      return NextResponse.json({ 
        success: true,
        message: "Request received. We'll contact you soon."
      });
    }

    // Create transporter - you'll need to configure this with your SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email to Sebastian
    const sebastianMailOptions = {
      from: process.env.SMTP_USER, // Gmail requires using the authenticated email
      to: "sebastian@poap.fr",
      subject: "New Commercial Access Request - POAP Studio",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C65C1;">New Commercial Access Request</h2>
          <p>A potential customer has requested information about commercial access to POAP Studio.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>This person is interested in commercial features for POAP Studio. Please reach out to them to discuss enterprise solutions and pricing.</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated message from POAP Studio.
          </p>
        </div>
      `,
    };

    // Email to the requester
    const requesterMailOptions = {
      from: process.env.SMTP_USER, // Gmail requires using the authenticated email
      to: email,
      subject: "We've received your request - POAP Studio",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C65C1;">Thank you for your interest!</h2>
          <p>We've received your request for commercial access to POAP Studio.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Our team will review your request and get back to you soon with information about:</p>
            <ul>
              <li>Enterprise features and capabilities</li>
              <li>Custom solutions for your needs</li>
              <li>Pricing and support options</li>
            </ul>
          </div>
          
          <p>In the meantime, you can explore our platform at <a href="${process.env.NEXT_PUBLIC_FRAME_URL || 'https://social.poap.studio'}" style="color: #7C65C1;">POAP Studio</a></p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The POAP Studio Team
          </p>
        </div>
      `,
    };

    // Send both emails
    try {
      console.log("Attempting to send emails...");
      console.log("To Sebastian:", sebastianMailOptions.to);
      console.log("To Requester:", requesterMailOptions.to);
      
      const results = await Promise.all([
        transporter.sendMail(sebastianMailOptions),
        transporter.sendMail(requesterMailOptions),
      ]);
      
      console.log("Emails sent successfully:", results);
      return NextResponse.json({ success: true });
    } catch (emailError) {
      console.error("Error sending emails with SMTP:", emailError);
      throw emailError;
    }
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { error: "Failed to send request" },
      { status: 500 }
    );
  }
}