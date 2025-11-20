import { redirect } from 'next/navigation';
import { getCurrentUser, getUserData, verifyDirectorRole } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Calendar from '@/components/Calendar';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get full user data from Firestore
  const userData = await getUserData(user.uid);
  
  if (!userData) {
    redirect('/login');
  }

  // Verify user is Director
  const isDirector = await verifyDirectorRole(user.uid);
  
  if (!isDirector) {
    // Log them out and redirect
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <Navbar 
        userEmail={userData.email || user.email || 'User'} 
        userName={userData.name || 'User'}
        userRole={userData.role}
        employeeId={userData.employeeId}
        department={userData.department}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Leave Calendar
              </h1>
              <p className="text-gray-600">
                Manage Saturday holidays - Click any Saturday to toggle holiday status
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="font-semibold text-sm uppercase tracking-wide">Director</span>
              </div>
            </div>
          </div>
        </div>
        <Calendar />
      </main>
    </div>
  );
}

