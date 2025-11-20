import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebaseAdmin';

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
    const decodedIdToken = await adminAuth.verifySessionCookie(session, true);
    const currentUser = await adminAuth.getUser(decodedIdToken.uid);
    return currentUser;
  } catch (error) {
    return null;
  }
}

// Get user data from Firestore (including role)
export async function getUserData(uid: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return null;
    }

    return userDoc.data();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Get just the role
export async function getUserRole(uid: string): Promise<string | null> {
  const userData = await getUserData(uid);
  return userData?.role || null;
}

// UPDATED: Check if user is Director
export async function verifyDirectorRole(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'Director';
}

export async function createSessionCookie(idToken: string) {
  try {
    // Verify the ID token first
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedIdToken.uid;

    // Check if user exists in Firestore users collection
    const userData = await getUserData(uid);
    
    if (!userData) {
      throw new Error('USER_NOT_FOUND');
    }

    // Check if user has Director role
    const isDirector = await verifyDirectorRole(uid);
    
    if (!isDirector) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
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

