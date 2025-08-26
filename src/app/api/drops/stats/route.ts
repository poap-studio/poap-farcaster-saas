import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';
import { getSessionFromRequest } from '~/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.userId || request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dropIds = searchParams.get('ids')?.split(',') || [];
    
    if (dropIds.length === 0) {
      return NextResponse.json(
        { error: 'No drop IDs provided' },
        { status: 400 }
      );
    }

    // Verify user owns these drops
    const userDrops = await prisma.drop.findMany({
      where: {
        id: { in: dropIds },
        userId
      },
      select: { id: true }
    });

    const validDropIds = userDrops.map(d => d.id);
    
    // Get stats
    const drops = await prisma.drop.findMany({
      where: { id: { in: validDropIds } },
      include: {
        _count: {
          select: { 
            claims: true,
            lumaDeliveries: true,
            instagramDeliveries: true
          }
        }
      }
    });

    // Get Instagram stats
    const instagramDrops = drops.filter(d => d.platform === 'instagram' && d.instagramStoryId);
    const instagramStats: Record<string, { collectors: number; interactions: number }> = {};
    
    if (instagramDrops.length > 0) {
      const interactionsData = await prisma.$queryRaw<Array<{ story_id: string; count: bigint }>>`
        SELECT story_id, COUNT(*)::bigint as count 
        FROM "InstagramMessage" 
        WHERE story_id = ANY(${instagramDrops.map(d => d.instagramStoryId)})
        GROUP BY story_id
      `;
      
      const collectorsData = await prisma.$queryRaw<Array<{ drop_id: string; count: bigint }>>`
        SELECT drop_id, COUNT(*)::bigint as count
        FROM "InstagramDelivery"
        WHERE drop_id = ANY(${instagramDrops.map(d => d.id)})
        AND delivery_status = 'delivered'
        GROUP BY drop_id
      `;
      
      instagramDrops.forEach(drop => {
        const interactions = interactionsData.find(d => d.story_id === drop.instagramStoryId);
        const collectors = collectorsData.find(d => d.drop_id === drop.id);
        
        instagramStats[drop.id] = {
          interactions: Number(interactions?.count || 0),
          collectors: Number(collectors?.count || 0)
        };
      });
    }

    const stats: Record<string, { claims: number; lumaDeliveries: number; instagramDeliveries: number; instagramStats?: { collectors: number; interactions: number } }> = {};
    drops.forEach(drop => {
      stats[drop.id] = {
        claims: drop._count.claims,
        lumaDeliveries: drop._count.lumaDeliveries,
        instagramDeliveries: drop._count.instagramDeliveries,
        ...(drop.platform === 'instagram' && instagramStats[drop.id] ? { instagramStats: instagramStats[drop.id] } : {})
      };
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[Stats GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}