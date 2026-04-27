import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    /** Attach email to the session so client components can read it. */
    async session({ session }) {
      return session;
    },
  },

  pages: {
    signIn: '/manager',          // redirect unauthorized users back to the manager page
    error:  '/manager',          // auth errors also land here
  },
};
