import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyDirectorRole } from '@/lib/auth';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is Director
    const isDirector = await verifyDirectorRole(user.uid);
    
    if (!isDirector) {
      return NextResponse.json(
        { error: 'Only Directors can modify Saturday leave status' },
        { status: 403 }
      );
    }

    const { date, isHoliday } = await request.json();

    if (!date || typeof isHoliday !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Update saturdayLeave collection instead of leaves
    const leaveRef = adminDb.collection('saturdayLeave').doc(date);
    await leaveRef.set(
      {
        date,
        isHoliday,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Saturday leave status updated',
      data: { date, isHoliday },
    });
  } catch (error: any) {
    console.error('Error toggling Saturday leave:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

