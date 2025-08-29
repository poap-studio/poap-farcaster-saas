import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '~/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow @poap.fr emails for admin
      if (user.email && !user.email.endsWith('@poap.fr')) {
        return false;
      }
      
      // Check if user is in AuthorizedUser table
      const authorizedUser = await prisma.authorizedUser.findUnique({
        where: { email: user.email! },
      });
      
      if (!authorizedUser || !authorizedUser.isActive) {
        return false;
      }
      
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const authorizedUser = await prisma.authorizedUser.findUnique({
          where: { email: session.user.email },
        });
        
        if (authorizedUser) {
          (session.user as { isAdmin?: boolean; username?: string }).isAdmin = authorizedUser.isAdmin;
          (session.user as { isAdmin?: boolean; username?: string }).username = authorizedUser.username || undefined;
        }
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};