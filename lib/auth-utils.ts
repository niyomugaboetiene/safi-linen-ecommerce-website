import { auth } from './auth';
import { SessionUser } from '@/types/api';
import { AuthenticationError, AuthorizationError } from './error-handler';

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
    throw new AuthenticationError('Authentication required. Please sign in.');
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }

  return user;
}

export async function requireCustomer(): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (user.role !== 'customer' && user.role !== 'admin') {
    throw new AuthorizationError('Customer access required');
  }

  return user;
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'admin';
}

export function isAuthenticated(user: SessionUser | null): boolean {
  return !!user;
}

// Helper to check if user has access to a resource
export function canAccessUserResource(
  currentUser: SessionUser,
  resourceUserId: string
): boolean {
  return currentUser.role === 'admin' || currentUser.id === resourceUserId;
}

// Helper to get user ID safely
export function getUserId(user: SessionUser | null): string | null {
  return user?.id || null;
}

// Helper to check if user is active (not suspended or deleted)
export function isActiveUser(user: SessionUser | null): boolean {
  if (!user) return false;
  
  const accountStatus = (user as any).accountStatus;
  return accountStatus === 'active' || accountStatus === undefined;
}