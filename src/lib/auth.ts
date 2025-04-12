import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import prisma from "@/lib/prisma"
import authConfig from "@/lib/auth.config"

const adapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  debug: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: '/auth/signin',
    //signOut: '/auth/signout',
    //error: '/auth/error',
    //verifyRequest: '/auth/verify-request',
    //newUser: '/auth/new-user'
  },
  ...authConfig,
});

