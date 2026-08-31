import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { userRepository } from '@/lib/dynamodb/repositories/userRepository';

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Please define the GOOGLE_CLIENT_ID environment variable');
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Please define the GOOGLE_CLIENT_SECRET environment variable');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await userRepository.getUserByEmail(credentials.email);

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (user.accountStatus !== 'active') {
          throw new Error('Account is not active. Please contact support.');
        }

        if (!user.password) {
          throw new Error('This account uses Google authentication. Please sign in with Google.');
        }

        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.profileImage,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await userRepository.getUserByEmail(user.email || '');

          if (!existingUser) {
            // Create new user with Google info
            await userRepository.createUser({
              name: user.name || 'Google User',
              email: user.email || '',
              profileImage: user.image,
              googleId: account.providerAccountId,
              role: 'customer',
            });
          } else {
            // Update existing user with Google info if needed
            if (!existingUser.googleId) {
              await userRepository.updateUser(existingUser.userId, {
                profileImage: existingUser.profileImage || user.image || '',
              });
            }
          }

          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'customer';
      }

      // If it's a Google sign-in, get the user from database
      if (account?.provider === 'google') {
        try {
          const dbUser = await userRepository.getUserByEmail(token.email || '');
          if (dbUser) {
            token.id = dbUser.userId;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);