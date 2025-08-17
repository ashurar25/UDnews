import { useState, useEffect } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiInfo } from 'react-icons/fi';
import { getWanPhraDates, getNextWanPhra, getThaiHolidaysForMonth } from '@/lib/thai-calendar-new';

interface HolyDay {
  date: string;
  label: string;
  isHoliday?: boolean;
  holidayName?: string;
}

export default function BuddhistHolyDays() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [holyDays, setHolyDays] = useState<HolyDay[]>([]);
  const [nextWanPhra, setNextWanPhra] = useState<{ date: string; label: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch Wan Phra dates and Thai holidays in parallel
        const [wanPhraDates, holidays] = await Promise.all([
          getWanPhraDates(year, month),
          getThaiHolidaysForMonth(year, month)
        ]);
        
        // Get next Wan Phra
        const nextWanPhra = await getNextWanPhra();
        
        // Combine Wan Phra with holidays
        const holyDaysList: HolyDay[] = wanPhraDates.map(wanPhra => {
          const holiday = holidays.find(h => h.date === wanPhra.date);
          return {
            ...wanPhra,
            isHoliday: !!holiday,
            holidayName: holiday?.name
          };
        });
        
        // Add any holidays that aren't already in the list
        holidays.forEach(holiday => {
          if (!holyDaysList.some(d => d.date === holiday.date)) {
            holyDaysList.push({
              date: holiday.date,
              label: 'วันหยุดราชการ',
              isHoliday: true,
              holidayName: holiday.name
            });
          }
        });
        
        // Sort by date
        holyDaysList.sort((a, b) => a.date.localeCompare(b.date));
        
        setHolyDays(holyDaysList);
        setNextWanPhra(nextWanPhra);
      } catch (err) {
        console.error('Error fetching Buddhist holy days:', err);
        setError('ไม่สามารถโหลดข้อมูลวันพระได้ในขณะนี้');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year, month]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      weekday: 'long'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
        <h3 className="font-medium text-gray-800 flex items-center">
          <FiCalendar className="mr-2 text-orange-600" />
          ปฏิทินวันพระและวันหยุด
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToCurrentMonth}
            className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50 text-gray-700"
          >
            เดือนนี้
          </button>
        </div>
      </div>
      
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 text-gray-500 hover:text-orange-600 rounded-full hover:bg-orange-50"
            aria-label="เดือนก่อนหน้า"
          >
            <FiChevronLeft size={20} />
          </button>
          
          <h4 className="text-lg font-medium text-gray-800">
            {monthNames[month - 1]} {year + 543}
          </h4>
          
          <button
            onClick={goToNextMonth}
            className="p-1 text-gray-500 hover:text-orange-600 rounded-full hover:bg-orange-50"
            aria-label="เดือนถัดไป"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
        
        {nextWanPhra && (
          <div className="mt-2 p-2 bg-orange-50 text-orange-800 text-sm rounded-md flex items-start">
            <FiInfo className="flex-shrink-0 mt-0.5 mr-2 text-orange-600" />
            <div>
              <span className="font-medium">วันพระถัดไป:</span>{' '}
              {formatDate(nextWanPhra.date)} <span className="text-orange-700">({nextWanPhra.label})</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="divide-y">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            กำลังโหลดข้อมูลวันพระ...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        ) : holyDays.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            ไม่มีวันพระหรือวันหยุดในเดือนนี้
          </div>
        ) : (
          <ul className="divide-y">
            {holyDays.map((day, index) => (
              <li key={index} className="p-3 hover:bg-gray-50">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    day.isHoliday ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {new Date(day.date).getDate()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(day.date)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {day.holidayName || day.label}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="p-3 bg-gray-50 text-xs text-gray-500 border-t">
        <p className="text-center">วันพระ หมายถึง วันสำคัญทางพระพุทธศาสนาที่มีขึ้นทุก 7-8 วัน</p>
      </div>
    </div>
  );
}
