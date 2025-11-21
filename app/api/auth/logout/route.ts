import { NextResponse } from 'next/server';
import { removeSession } from '@/lib/auth';

export async function POST() {
  try {
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
