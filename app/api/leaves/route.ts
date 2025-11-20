import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch from saturdayLeave collection instead of leaves
    const saturdayLeaveRef = adminDb.collection('saturdayLeave');
    const snapshot = await saturdayLeaveRef.get();

    const leaves: any = {};
    snapshot.forEach((doc) => {
      leaves[doc.id] = doc.data();
    });

    return NextResponse.json({ success: true, leaves });
  } catch (error: any) {
    console.error('Error fetching Saturday leaves:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

