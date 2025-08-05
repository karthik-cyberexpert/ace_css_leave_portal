import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, getMonth } from 'date-fns';

interface RequestChartData {
  start_date: string;
  total_days: number;
  status: string;
  request_type?: 'leave' | 'od'; // Add type to distinguish between leave and OD
}

interface MonthlyLeaveChartProps {
  leaveData: RequestChartData[];
  odData: RequestChartData[];
}

const MonthlyLeaveChart = ({ leaveData, odData }: MonthlyLeaveChartProps) => {
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    name: format(new Date(0, i), 'MMM'),
    leaves: 0,
    od: 0,
  }));

  // Process leave requests
  leaveData.forEach(request => {
    if (request.status === 'Approved') {
      const monthIndex = getMonth(new Date(request.start_date));
      if (monthlyData[monthIndex]) {
        monthlyData[monthIndex].leaves += request.total_days;
      }
    }
  });

  // Process OD requests
  odData.forEach(request => {
    if (request.status === 'Approved') {
      const monthIndex = getMonth(new Date(request.start_date));
      if (monthlyData[monthIndex]) {
        monthlyData[monthIndex].od += request.total_days;
      }
    }
  });

  return (
    <Card className="col-span-1 lg:col-span-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <CardTitle>Monthly Leave & OD Report</CardTitle>
        <CardDescription>Total approved leave days and OD days per month for the current year.</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="leaves" fill="#3b82f6" name="Leave Days" />
            <Bar dataKey="od" fill="#10b981" name="OD Days" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyLeaveChart;