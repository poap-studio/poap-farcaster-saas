import { NextRequest, NextResponse } from "next/server";
import { getSession } from "~/lib/session";
import { prisma } from "~/lib/prisma";
import { syncLumaGuests } from "~/lib/luma-sync";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all' or 'checkedin'

    // Get the drop
    const drop = await prisma.drop.findUnique({
      where: { 
        id: params.id,
        userId: session.userId 
      }
    });

    if (!drop) {
      return NextResponse.json({ error: "Drop not found" }, { status: 404 });
    }

    if (drop.platform !== 'luma' || !drop.lumaEventId) {
      return NextResponse.json({ error: "Not a Luma drop" }, { status: 400 });
    }

    // Sync guests first
    await syncLumaGuests(drop.id, drop.lumaEventId);

    // Fetch guests from database
    const guests = await prisma.lumaGuest.findMany({
      where: {
        dropId: drop.id,
        ...(type === 'checkedin' ? { checkedInAt: { not: null } } : {})
      },
      orderBy: { name: 'asc' }
    });

    // Create CSV content
    const headers = [
      'Name',
      'Email',
      'Status',
      'Checked In',
      'Registered At',
      'Ethereum Address',
      'Solana Address',
      'Phone Number',
      'City',
      'Country',
      'Twitter',
      'Instagram',
      'LinkedIn',
      'Website'
    ];

    const rows = guests.map(guest => [
      guest.name,
      guest.email,
      guest.approvalStatus || 'N/A',
      guest.checkedInAt ? 'Yes' : 'No',
      new Date(guest.registeredAt).toLocaleString(),
      guest.ethAddress || '',
      guest.solanaAddress || '',
      guest.phoneNumber || '',
      guest.geoCity || '',
      guest.geoCountry || '',
      guest.twitterHandle || '',
      guest.instagramHandle || '',
      guest.linkedinHandle || '',
      guest.website || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const filename = `luma-guests-${type}-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("Error downloading guests:", error);
    return NextResponse.json(
      { error: "Failed to download guests" },
      { status: 500 }
    );
  }
}