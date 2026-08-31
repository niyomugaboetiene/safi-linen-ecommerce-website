import { auth } from './auth';
import { SessionUser } from '@/types/api';

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return null;
    }

    return session.user as SessionUser;
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  
  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

export async function requireCustomer(): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (user.role !== 'customer' && user.role !== 'admin') {
    throw new Error('Forbidden: Customer access required');
  }

  return user;
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'admin';
}

export function isAuthenticated(user: SessionUser | null): boolean {
  return !!user;
}