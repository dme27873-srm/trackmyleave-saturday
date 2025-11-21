import { cookies } from 'next/headers';

// Hardcoded credentials
const HARDCODED_USER = {
  email: 'admin@srmorg.com',
  password: 'eec@2025',
  uid: 'hardcoded-admin-uid',
  role: 'Director'
};

export async function getSession() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('session')?.value;
  } catch (error) {
    return undefined;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  
  try {
    // Parse the session to get user info
    const userData = JSON.parse(session);
    
    // Verify session hasn't expired
    if (userData.expiresAt && Date.now() > userData.expiresAt) {
      return null;
    }
    
    return userData;
  } catch (error) {
    return null;
  }
}

export async function createSessionCookie(email: string, password: string) {
  try {
    // Verify hardcoded credentials
    if (email !== HARDCODED_USER.email || password !== HARDCODED_USER.password) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    
    // Create session data
    const sessionData = {
      uid: HARDCODED_USER.uid,
      email: HARDCODED_USER.email,
      role: HARDCODED_USER.role,
      expiresAt: Date.now() + expiresIn
    };
    
    const sessionCookie = JSON.stringify(sessionData);
    
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return sessionCookie;
  } catch (error) {
    throw error;
  }
}

export async function removeSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getUserData(uid: string) {
  try {
    // Since you're using hardcoded credentials, return user data directly
    if (uid === HARDCODED_USER.uid) {
      return {
        uid: HARDCODED_USER.uid,
        email: HARDCODED_USER.email,
        role: HARDCODED_USER.role,
        name: 'Admin User',
        employeeId: 'EMP001',
        department: 'Administration'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function verifyDirectorRole(uid: string): Promise<boolean> {
  try {
    const userData = await getUserData(uid);
    
    // Check if user exists and has Director role
    if (!userData || userData.role !== 'Director') {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying director role:', error);
    return false;
  }
}
