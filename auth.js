// auth.js - WORKING VERSION
import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import clientPromise from "./lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("🔐 Auth.js authorize called for:", credentials.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials");
            return null;
          }

          // 🎯 DIRECT MONGODB QUERY - NO API CALLS!
          const client = await clientPromise;
          const db = client.db();
          
          const user = await db.collection("users").findOne({ 
            email: credentials.email.toLowerCase().trim() 
          });

          if (!user) {
            console.log("❌ User not found");
            return null;
          }

          console.log("✅ User found:", user.email);
          
          if (!user.password) {
            console.log("❌ User has no password");
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            console.log("❌ Password invalid");
            return null;
          }

          console.log("✅ Login successful, returning user");
          
          return {
            id: user._id?.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0],
            role: user.role || "User", // 🎯 Capitalized: Admin, User, Customer
            isVerified: user.isVerified || false,
            isTwoFactorEnabled: user.isTwoFactorEnabled || false,
          };
        } catch (error) {
          console.error("🔥 Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role; // 🎯 Role goes into JWT
        token.isVerified = user.isVerified;
        token.isTwoFactorEnabled = user.isTwoFactorEnabled;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role; // 🎯 Role available in session
        session.user.isVerified = token.isVerified;
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },

  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // 🎯 FALSE for localhost, TRUE for production
      },
    },
  },
  
  debug: true, // Enable for debugging
});