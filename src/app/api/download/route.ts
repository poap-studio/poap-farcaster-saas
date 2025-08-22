import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const stringField = String(field);
  if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

export async function GET(request: Request) {
  try {
    // Get dropId from query params if provided
    const { searchParams } = new URL(request.url);
    const dropId = searchParams.get('dropId');
    
    if (!dropId) {
      return NextResponse.json(
        { error: 'Drop ID is required' },
        { status: 400 }
      );
    }

    // First check what platform this drop is
    const drop = await prisma.drop.findUnique({
      where: { id: dropId }
    });

    if (!drop) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    let csvContent: string;
    let fileName: string;

    if (drop.platform === 'luma') {
      // Fetch Luma deliveries
      const deliveries = await prisma.lumaDelivery.findMany({
        where: { dropId },
        orderBy: { sentAt: 'desc' }
      });

      if (deliveries.length === 0) {
        return new NextResponse("No deliveries found", {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }

      const csvHeader = 'Name,Email,Guest ID,POAP Link,Sent At,Checked In At\n';
      const csvRows = deliveries.map(delivery => {
        return [
          escapeCSVField(delivery.name),
          escapeCSVField(delivery.email),
          escapeCSVField(delivery.guestId),
          escapeCSVField(delivery.poapLink),
          escapeCSVField(delivery.sentAt.toISOString()),
          escapeCSVField(delivery.checkedInAt?.toISOString() || 'Not checked in')
        ].join(',');
      });

      csvContent = csvHeader + csvRows.join('\n');
      fileName = `luma-deliveries-${drop.lumaEventId}-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Fetch Farcaster claims
      const claims = await prisma.claim.findMany({
        where: { dropId },
        include: {
          drop: true
        },
        orderBy: {
          claimedAt: 'desc'
        }
      });
      
      if (claims.length === 0) {
        return new NextResponse("No POAP claims found", {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }
      
      const csvHeader = 'FID,Username,Followers,Drop ID,Event ID,Address,Claimed At,Transaction Hash\n';
      const csvRows = claims.map(claim => {
        return [
          escapeCSVField(claim.fid),
          escapeCSVField(claim.username || ''),
          escapeCSVField(claim.followers || 0),
          escapeCSVField(claim.dropId),
          escapeCSVField(claim.drop.poapEventId),
          escapeCSVField(claim.address),
          escapeCSVField(claim.claimedAt.toISOString()),
          escapeCSVField(claim.txHash || '')
        ].join(',');
      });
      
      csvContent = csvHeader + csvRows.join('\n');
      fileName = `poap-claims-${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV download:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate CSV download' },
      { status: 500 }
    );
  }
}