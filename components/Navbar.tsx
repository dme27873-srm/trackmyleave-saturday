'use client';

import { useRouter } from 'next/navigation';

interface NavbarProps {
  userEmail: string;
  userName?: string;
  userRole?: string | null;
  employeeId?: string;
  department?: string;
}

export default function Navbar({ userEmail, userName, userRole, employeeId, department }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800">Leave Manager</span>
              {department && (
                <p className="text-xs text-gray-500">{department}</p>
              )}
            </div>
          </div>
          
          {/* User Info and Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-gray-900 font-semibold text-sm">
                  {userName || userEmail}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  {employeeId && (
                    <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">{employeeId}</span>
                  )}
                  {userRole && (
                    <span className="text-purple-600 font-semibold uppercase">{userRole}</span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        
        {/* Mobile User Info */}
        <div className="sm:hidden mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-900 font-semibold text-sm">{userName || userEmail}</p>
          <div className="flex items-center space-x-2 mt-1">
            {employeeId && (
              <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded">{employeeId}</span>
            )}
            {userRole && (
              <span className="text-xs text-purple-600 font-semibold uppercase">{userRole}</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

