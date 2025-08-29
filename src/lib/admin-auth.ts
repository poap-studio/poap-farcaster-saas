import { getSession } from '~/lib/session';
import { prisma } from '~/lib/prisma';

export async function checkAdminAccess(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) {
      return false;
    }

    // Get user to check if they have admin access
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true }
    });

    // Check if user has @poap.fr email
    return user?.email?.endsWith('@poap.fr') || false;
  } catch {
    return false;
  }
}