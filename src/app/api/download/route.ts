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
    
    // Fetch claims from database
    const claims = await prisma.claim.findMany({
      where: dropId ? { dropId } : undefined,
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
    
    const csvHeader = 'FID,Username,Drop ID,Event ID,Address,Claimed At,Transaction Hash\n';
    const csvRows = claims.map(claim => {
      return [
        escapeCSVField(claim.fid),
        escapeCSVField(claim.username || ''),
        escapeCSVField(claim.dropId),
        escapeCSVField(claim.drop.poapEventId),
        escapeCSVField(claim.address),
        escapeCSVField(claim.claimedAt.toISOString()),
        escapeCSVField(claim.txHash || '')
      ].join(',');
    });
    
    const csvContent = csvHeader + csvRows.join('\n');
    
    const fileName = `poap-claims-${new Date().toISOString().split('T')[0]}.csv`;
    
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