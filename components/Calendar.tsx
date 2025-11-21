'use client';

import { useState, useEffect } from 'react';
import { CalendarData, LeaveDay } from '@/types';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSaturdays: 0, holidays: 0, workingDays: 0 });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch calendar data on mount
  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const response = await fetch('/api/leaves');
      if (response.ok) {
        const data = await response.json();
        setCalendarData(data.leaves || {});
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  useEffect(() => {
    const saturdays = getSaturdaysInMonth(currentDate);
    const holidays = saturdays.filter(date => {
      const dateStr = formatDate(date);
      return calendarData[dateStr]?.isHoliday !== false;
    }).length;
    
    setStats({
      totalSaturdays: saturdays.length,
      holidays,
      workingDays: saturdays.length - holidays,
    });
  }, [currentDate, calendarData]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // FIX: Format date in local timezone (IST) instead of UTC
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getSaturdaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const saturdays: Date[] = [];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 6) { // Saturday
        saturdays.push(new Date(d));
      }
    }

    return saturdays;
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const toggleHoliday = async (date: Date) => {
    // Check if date is in the past
    if (isPastDate(date)) {
      showToast('Cannot modify past dates. Only future dates can be changed.', 'error');
      return;
    }

    const dateStr = formatDate(date);
    const currentStatus = calendarData[dateStr]?.isHoliday ?? true; // Default is holiday
    const newStatus = !currentStatus;

    // Optimistic update
    if (newStatus) {
      // If toggling back to holiday, remove from state (will be deleted from DB)
      const newData = { ...calendarData };
      delete newData[dateStr];
      setCalendarData(newData);
    } else {
      // If marking as working day, add to state
      setCalendarData(prev => ({
        ...prev,
        [dateStr]: {
          date: dateStr,
          isHoliday: false,
          updatedAt: new Date().toISOString(),
        },
      }));
    }

    try {
      const response = await fetch('/api/leaves/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, isHoliday: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Revert on error
        setCalendarData(prev => ({
          ...prev,
          [dateStr]: {
            date: dateStr,
            isHoliday: currentStatus,
            updatedAt: new Date().toISOString(),
          },
        }));
        showToast(result.error || result.message || 'Failed to update', 'error');
      } else {
        // Show success message
        if (result.data?.deleted) {
          showToast('Saturday marked as holiday (default)', 'success');
        } else {
          showToast('Saturday marked as working day', 'success');
        }
      }
    } catch (error) {
      console.error('Error toggling holiday:', error);
      // Revert on error
      setCalendarData(prev => ({
        ...prev,
        [dateStr]: {
          date: dateStr,
          isHoliday: currentStatus,
          updatedAt: new Date().toISOString(),
        },
      }));
      showToast('Network error. Please try again.', 'error');
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const saturdays = getSaturdaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in ${
          toast.type === 'success' 
            ? 'bg-green-500' 
            : 'bg-red-500'
        } text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3`}>
          {toast.type === 'success' ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Saturdays</p>
              <p className="text-4xl font-bold mt-1">{stats.totalSaturdays}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Holidays</p>
              <p className="text-4xl font-bold mt-1">{stats.holidays}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Working Saturdays</p>
              <p className="text-4xl font-bold mt-1">{stats.workingDays}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Saturday Grid */}
        {saturdays.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No Saturdays in this month</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {saturdays.map((saturday) => {
              const dateStr = formatDate(saturday);
              const isHoliday = calendarData[dateStr]?.isHoliday ?? true;
              const isPast = isPastDate(saturday);
              
              return (
                <button
                  key={dateStr}
                  onClick={() => toggleHoliday(saturday)}
                  disabled={isPast}
                  className={`
                    p-6 rounded-xl border-2 transition-all duration-200 transform 
                    ${isPast 
                      ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-300' 
                      : 'hover:scale-105 active:scale-95'
                    }
                    ${!isPast && isHoliday
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:border-green-400 shadow-md'
                      : ''
                    }
                    ${!isPast && !isHoliday
                      ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:border-red-400 shadow-md'
                      : ''
                    }
                  `}
                >
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      isPast ? 'text-gray-500' :
                      isHoliday ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {saturday.getDate()}
                    </div>
                    <div className={`text-xs font-semibold uppercase tracking-wide ${
                      isPast ? 'text-gray-500' :
                      isHoliday ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Saturday
                    </div>
                    <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                      isPast 
                        ? 'bg-gray-200 text-gray-600'
                        : isHoliday
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {isPast ? '🔒 Past' : isHoliday ? '🎉 Holiday' : '💼 Working'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300"></div>
              <span className="text-sm text-gray-700">Holiday (Default)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300"></div>
              <span className="text-sm text-gray-700">Working Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300"></div>
              <span className="text-sm text-gray-700">Past Date (Locked)</span>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            Click future Saturdays to toggle. Past dates cannot be modified.
          </p>
        </div>
      </div>
    </div>
  );
}
