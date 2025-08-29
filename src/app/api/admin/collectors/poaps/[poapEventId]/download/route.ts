import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';
import { checkAdminAccess } from '~/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ poapEventId: string }> }
) {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { poapEventId } = await params;

    // Get all collectors for this POAP across all platforms
    const [farcasterCollectors, lumaCollectors, instagramCollectors] = await Promise.all([
      // Farcaster collectors
      prisma.claim.findMany({
        where: {
          drop: {
            poapEventId: poapEventId,
            platform: 'farcaster'
          }
        },
        include: {
          drop: {
            select: {
              slug: true,
              createdAt: true,
            }
          }
        },
        orderBy: {
          claimedAt: 'desc'
        }
      }),
      
      // Luma collectors
      prisma.lumaDelivery.findMany({
        where: {
          drop: {
            poapEventId: poapEventId,
            platform: 'luma'
          }
        },
        include: {
          drop: {
            select: {
              slug: true,
              lumaEventUrl: true,
              createdAt: true,
            }
          }
        },
        orderBy: {
          sentAt: 'desc'
        }
      }),
      
      // Instagram collectors
      prisma.instagramDelivery.findMany({
        where: {
          drop: {
            poapEventId: poapEventId,
            platform: 'instagram'
          },
          deliveryStatus: 'delivered'
        },
        include: {
          drop: {
            select: {
              slug: true,
              instagramStoryUrl: true,
              createdAt: true,
            }
          },
          message: {
            select: {
              senderUsername: true,
            }
          }
        },
        orderBy: {
          deliveredAt: 'desc'
        }
      })
    ]);

    // Get POAP info
    let poapName = poapEventId;
    try {
      const poapResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/poap/validate-event?eventId=${poapEventId}`);
      if (poapResponse.ok) {
        const poapData = await poapResponse.json();
        poapName = poapData.event?.name || poapEventId;
      }
    } catch (error) {
      console.error('Error fetching POAP info:', error);
    }

    // Format data for CSV
    const csvRows = [
      ['Platform', 'Recipient', 'Username/Email', 'Delivery Date', 'Drop URL', 'POAP Event ID', 'POAP Name'].join(',')
    ];

    // Add Farcaster collectors
    farcasterCollectors.forEach(collector => {
      csvRows.push([
        'Farcaster',
        collector.address || '',
        collector.username || '',
        collector.claimedAt.toISOString(),
        `${process.env.NEXT_PUBLIC_APP_URL}/drop/${collector.drop.slug}`,
        poapEventId,
        `"${poapName.replace(/"/g, '""')}"`
      ].join(','));
    });

    // Add Luma collectors
    lumaCollectors.forEach(collector => {
      csvRows.push([
        'Luma',
        collector.email || '',
        collector.email || '',
        collector.sentAt.toISOString(),
        collector.drop.lumaEventUrl || '',
        poapEventId,
        `"${poapName.replace(/"/g, '""')}"`
      ].join(','));
    });

    // Add Instagram collectors
    instagramCollectors.forEach(collector => {
      csvRows.push([
        'Instagram',
        collector.recipientValue || '',
        collector.message?.senderUsername ? `@${collector.message.senderUsername}` : '',
        collector.deliveredAt?.toISOString() || '',
        collector.drop.instagramStoryUrl || '',
        poapEventId,
        `"${poapName.replace(/"/g, '""')}"`
      ].join(','));
    });

    const csv = csvRows.join('\n');
    
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="collectors-poap-${poapEventId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error downloading collectors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}