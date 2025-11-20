import { NextResponse } from 'next/server';
import { removeSession, getSession } from '@/lib/auth';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST() {
  try {
    const session = await getSession();
    
    if (session) {
      // Revoke all refresh tokens
      const decodedIdToken = await adminAuth.verifySessionCookie(session);
      await adminAuth.revokeRefreshTokens(decodedIdToken.sub);
    }

    await removeSession();

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
