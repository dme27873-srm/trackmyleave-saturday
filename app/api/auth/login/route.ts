import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing email or password' },
        { status: 400 }
      );
    }

    await createSessionCookie(email, password);

    return NextResponse.json({ success: true, message: 'Logged in successfully' });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle invalid credentials
    if (error.message === 'INVALID_CREDENTIALS') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
