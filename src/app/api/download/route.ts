import { NextResponse } from "next/server";
import { getRedisClient } from "~/lib/redis";

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

export async function GET() {
  try {
    const client = await getRedisClient();
    const pattern = 'poap:claimed:*:*';
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) {
      return new NextResponse("No POAP claims found", {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
    
    const claims = await client.mGet(keys);
    const parsedClaims = claims
      .filter(claim => claim !== null)
      .map(claim => JSON.parse(claim!));
    
    parsedClaims.sort((a, b) => 
      new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()
    );
    
    const csvHeader = 'FID,Event ID,Address,Claimed At,Transaction Hash\n';
    const csvRows = parsedClaims.map(claim => {
      return [
        escapeCSVField(claim.fid),
        escapeCSVField(claim.eventId),
        escapeCSVField(claim.address),
        escapeCSVField(claim.claimedAt),
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