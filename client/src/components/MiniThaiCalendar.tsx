import React, { useMemo } from 'react';
import { formatThaiDateISO, toISO } from '@/lib/date-th';
import { getThaiHolidaysForMonth } from '@/lib/thai-calendar';
import { Calendar as CalendarIcon } from 'lucide-react';

type MiniThaiCalendarProps = {
  className?: string;
};

const daysTH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const MiniThaiCalendar: React.FC<MiniThaiCalendarProps> = ({ className = '' }) => {
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  // Get holidays for the current month
  const holidays = useMemo(() => getThaiHolidaysForMonth(year, month), [year, month]);
  
  // Get the first day of the month and number of days in the month
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Format today's date in ISO format for comparison (YYYY-MM-DD)
  const todayISO = today.toISOString().split('T')[0];
  
  // Generate calendar days
  const days = [];
  
  // Add empty cells for days before the 1st of the month
  for (let i = 0; i < startWeekday; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  
  // Add days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateISO = toISO(year, month, d);
    const isToday = dateISO === todayISO;
    const isHoliday = holidays.some(h => h.date === dateISO);
    const holiday = holidays.find(h => h.date === dateISO);
    
    days.push(
      <div 
        key={d}
        className={`
          relative w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
          ${isToday 
            ? 'bg-blue-600 text-white font-bold' 
            : isHoliday 
              ? 'text-red-600' 
              : 'text-gray-900 dark:text-gray-100'}
          `}
        title={holiday?.name}
      >
        {d}
        {isHoliday && (
          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-red-500"></span>
        )}
      </div>
    );
  }
  
  // Add empty cells to complete the last row
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    days.push(<div key={`empty-end-${i}`} className="w-8 h-8" />);
  }
  
  // Format month and year in Thai
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiYear = year + 543;
  const monthName = thaiMonths[month - 1];
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5" />
          <h3 className="font-bold">ปฏิทิน</h3>
        </div>
        <div className="text-sm">
          {day} {monthName} {thaiYear}
        </div>
      </div>
      
      <div className="p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {daysTH.map((day) => (
            <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        
        {/* Legend */}
        <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>วันนี้</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>วันหยุด</span>
          </div>
        </div>
      </div>
      
      {/* Upcoming holidays */}
      {holidays.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-700/30">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">วันหยุดที่จะถึง</h4>
          <div className="space-y-1">
            {holidays.slice(0, 2).map((holiday, index) => (
              <div key={index} className="flex items-center text-sm">
                <span className="w-16 font-medium text-red-600 dark:text-red-400">
                  {holiday.date.split('-')[2]}/{holiday.date.split('-')[1]}
                </span>
                <span className="text-gray-700 dark:text-gray-300 truncate" title={holiday.name}>
                  {holiday.name.length > 20 ? `${holiday.name.substring(0, 20)}...` : holiday.name}
                </span>
              </div>
            ))}
            {holidays.length > 2 && (
              <div className="text-xs text-blue-600 dark:text-blue-400 text-right">
                +{holidays.length - 2} วันหยุดเพิ่มเติม
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
