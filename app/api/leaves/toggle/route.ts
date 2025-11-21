import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is Director (check role from session)
    if (user.role !== 'Director') {
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
    
    // FIX: Parse date in IST timezone
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); // Creates date in local timezone
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight IST
    selectedDate.setHours(0, 0, 0, 0); // Reset to midnight IST
    
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
    
    // If toggling back to holiday (default state), DELETE the document
    if (isHoliday) {
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
          isHoliday: false,
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
