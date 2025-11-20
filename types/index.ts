export interface LeaveDay {
  date: string; // YYYY-MM-DD format
  isHoliday: boolean;
  updatedAt: string;
}

export interface User {
  uid: string;
  email: string | null;
}

export interface CalendarData {
  [key: string]: LeaveDay; // key is date in YYYY-MM-DD format
}
