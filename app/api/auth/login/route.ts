import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing idToken' },
        { status: 400 }
      );
    }

    await createSessionCookie(idToken);

    return NextResponse.json({ success: true, message: 'Logged in successfully' });
  } catch (error: any) {
    console.error('Login error:', error);

    // Handle user not found in Firestore
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found in system. Please contact administrator.',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Handle insufficient permissions error
    if (error.message === 'INSUFFICIENT_PERMISSIONS') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access Denied: You do not have the required permissions to access this system.',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

