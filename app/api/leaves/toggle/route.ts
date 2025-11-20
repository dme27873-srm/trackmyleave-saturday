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

    // NEW: Check if date is in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return NextResponse.json(
        { 
          error: 'Cannot modify past dates',
          message: 'You can only modify future Saturday leave status'
        },
        { status: 400 }
      );
    }

    const leaveRef = adminDb.collection('saturdayLeave').doc(date);

    // NEW: If toggling back to holiday (default state), DELETE the document
    if (isHoliday) {
      // Delete the document instead of updating it
      await leaveRef.delete();
      
      return NextResponse.json({
        success: true,
        message: 'Saturday marked as holiday (default state)',
        data: { date, isHoliday, deleted: true },
      });
    } else {
      // If marking as working day, create/update the document
      await leaveRef.set(
        {
          date,
          isHoliday: false, // Explicitly mark as working day
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid,
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Saturday marked as working day',
        data: { date, isHoliday: false },
      });
    }
  } catch (error: any) {
    console.error('Error toggling Saturday leave:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

