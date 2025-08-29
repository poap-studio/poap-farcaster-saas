import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';
import { checkAdminAccess } from '~/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Get all unique POAP event IDs with collector counts
    const dropGroups = await prisma.drop.groupBy({
      by: ['poapEventId'],
      _count: {
        _all: true,
      },
      where: search ? {
        poapEventId: {
          contains: search,
          mode: 'insensitive'
        }
      } : undefined,
    });

    // For each POAP, get collector counts by platform
    const groups = await Promise.all(
      dropGroups.map(async (group) => {
        // Get Farcaster collectors count
        const farcasterCount = await prisma.claim.count({
          where: {
            drop: {
              poapEventId: group.poapEventId,
              platform: 'farcaster'
            }
          }
        });

        // Get Luma collectors count
        const lumaCount = await prisma.lumaDelivery.count({
          where: {
            drop: {
              poapEventId: group.poapEventId,
              platform: 'luma'
            }
          }
        });

        // Get Instagram collectors count
        const instagramCount = await prisma.instagramDelivery.count({
          where: {
            drop: {
              poapEventId: group.poapEventId,
              platform: 'instagram'
            },
            deliveryStatus: 'delivered'
          }
        });

        const totalCollectors = farcasterCount + lumaCount + instagramCount;

        return {
          poapEventId: group.poapEventId,
          totalCollectors,
          platforms: {
            farcaster: farcasterCount,
            luma: lumaCount,
            instagram: instagramCount,
          },
        };
      })
    );

    // Sort by total collectors descending
    groups.sort((a, b) => b.totalCollectors - a.totalCollectors);

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching POAP groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}