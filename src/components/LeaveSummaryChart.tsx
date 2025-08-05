import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { calculateWorkingDaysFromSemesterStart } from '@/utils/dateUtils';

const COLORS = ['#ef4444', '#22c55e', '#64748b']; // Red for leave, Green for attended, Gray for no data

const LeaveSummaryChart = () => {
  const { currentUser } = useAppContext();
  const { getSemesterDateRange, semesterDates } = useBatchContext();
  
  // Handle case when currentUser is not loaded yet
  if (!currentUser) {
    return (
      <Card className="lg:col-span-2 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Leave Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="text-center py-8 text-muted-foreground">Loading leave summary...</div>
        </CardContent>
      </Card>
    );
  }
  
  const leavesTaken = currentUser.leave_taken || 0;
  
  // Calculate total working days from semester start to current date
  const totalWorkingDays = useMemo(() => {
    if (!currentUser?.batch || !currentUser?.semester) {
      return 0;
    }

    console.log('LeaveSummaryChart: Calculating working days for:', {
      batch: currentUser.batch,
      semester: currentUser.semester,
      semesterDatesLength: semesterDates?.length || 0
    });

    // First, try to find the semester date directly from context (same as DashboardOverview)
    const directSemesterDate = semesterDates.find(sd => 
      sd.batch === currentUser.batch && sd.semester === currentUser.semester
    );
    
    let semesterStartDate = null;
    
    if (directSemesterDate && directSemesterDate.startDate) {
      semesterStartDate = directSemesterDate.startDate;
      console.log('LeaveSummaryChart: Using direct semester date from context:', semesterStartDate);
    } else {
      // Fallback to getSemesterDateRange
      const semesterRange = getSemesterDateRange(currentUser.batch, currentUser.semester);
      console.log('LeaveSummaryChart: Semester range from getSemesterDateRange:', semesterRange);
      semesterStartDate = semesterRange?.start;
    }
    
    if (!semesterStartDate) {
      console.log('LeaveSummaryChart: No semester start date found, using July 21, 2025 as default');
      semesterStartDate = new Date('2025-07-21');
    }

    console.log('LeaveSummaryChart: Using semester start date:', semesterStartDate);
    const workingDays = calculateWorkingDaysFromSemesterStart(semesterStartDate);
    console.log('LeaveSummaryChart: Total working days calculated:', workingDays);
    return workingDays;
  }, [currentUser?.batch, currentUser?.semester, getSemesterDateRange, semesterDates]);
  
  // Calculate attendance: total working days minus leave days taken
  // Note: leavesTaken is now calculated dynamically on the backend including current day leaves
  const workingDaysAttended = Math.max(0, totalWorkingDays - leavesTaken);
  
  console.log('LeaveSummaryChart Debug:', {
    totalWorkingDays,
    leavesTaken,
    workingDaysAttended,
    studentBatch: currentUser?.batch,
    studentSemester: currentUser?.semester
  });
  
  // Only show data if we have working days to calculate from
  const leaveData = totalWorkingDays > 0 ? [
    { name: 'Days on Leave', value: leavesTaken },
    { name: 'Days Attended', value: workingDaysAttended },
  ] : [
    { name: 'No Data Available', value: 1 }
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalWorkingDays > 0 ? ((data.value / totalWorkingDays) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} day{data.value !== 1 ? 's' : ''} ({percentage}%)
          </p>
          {totalWorkingDays > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Total working days: {totalWorkingDays}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="lg:col-span-2 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Attendance vs Leave Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={leaveData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {leaveData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default LeaveSummaryChart;