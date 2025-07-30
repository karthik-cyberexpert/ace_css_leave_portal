import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { calculateWorkingDaysFromSemesterStart } from '@/utils/dateUtils';

const COLORS = ['#0088FE', '#00C49F']; // Colors for the pie chart segments

const LeaveSummaryChart = () => {
  const { currentUser } = useAppContext();
  const { getSemesterDateRange } = useBatchContext();
  
  const leavesTaken = currentUser.leave_taken;
  
  // Calculate total working days from semester start to current date
  const totalWorkingDays = useMemo(() => {
    if (!currentUser?.batch || !currentUser?.semester) {
      return 0;
    }

    const semesterRange = getSemesterDateRange(currentUser.batch, currentUser.semester);
    if (!semesterRange?.start) {
      return 0;
    }

    return calculateWorkingDaysFromSemesterStart(semesterRange.start);
  }, [currentUser?.batch, currentUser?.semester, getSemesterDateRange]);
  
  const allowedLeaves = totalWorkingDays > 0 ? totalWorkingDays : 0;
  const leavesRemaining = Math.max(0, allowedLeaves - leavesTaken);

  const leaveData = [
    { name: 'Leaves Taken', value: leavesTaken },
    { name: 'Leaves Remaining', value: leavesRemaining },
  ];

  return (
    <Card className="lg:col-span-2 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Leave Summary</CardTitle>
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
            <Tooltip />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default LeaveSummaryChart;