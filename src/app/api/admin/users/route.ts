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

    const where: Record<string, any> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.authorizedUser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Find User record by email
        const userRecord = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            drops: {
              include: {
                _count: {
                  select: {
                    claims: true,
                    lumaDeliveries: true,
                    instagramDeliveries: true,
                  },
                },
              },
            },
          },
        });

        if (!userRecord) {
          return {
            ...user,
            stats: {
              farcaster: 0,
              luma: 0,
              instagram: 0,
              totalCollectors: 0,
            },
          };
        }

        const stats = {
          farcaster: userRecord.drops.filter(d => d.platform === 'farcaster').length,
          luma: userRecord.drops.filter(d => d.platform === 'luma').length,
          instagram: userRecord.drops.filter(d => d.platform === 'instagram').length,
          totalCollectors: userRecord.drops.reduce((acc, drop) => {
            if (drop.platform === 'farcaster') return acc + drop._count.claims;
            if (drop.platform === 'luma') return acc + drop._count.lumaDeliveries;
            if (drop.platform === 'instagram') return acc + drop._count.instagramDeliveries;
            return acc;
          }, 0),
        };

        return { ...user, stats };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, username, isAdmin, authMethod } = await request.json();

    // Validate based on auth method
    if (authMethod === 'gmail' && !email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    if (authMethod === 'farcaster' && !username) {
      return NextResponse.json({ error: 'Farcaster username is required' }, { status: 400 });
    }

    // Create authorized user based on auth method
    const userData: any = {
      email: authMethod === 'gmail' ? email : '', 
      username: authMethod === 'farcaster' ? username : username || '',
      isAdmin: isAdmin || false,
    };

    // For Farcaster users, we might want to add a placeholder email
    if (authMethod === 'farcaster' && !email) {
      userData.email = `${username}@farcaster.placeholder`;
    }

    const user = await prisma.authorizedUser.create({
      data: userData,
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}