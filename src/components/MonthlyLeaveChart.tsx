import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, getMonth } from 'date-fns';

interface LeaveRequest {
  startDate: string;
  totalDays: number;
  status: string;
}

interface MonthlyLeaveChartProps {
  data: LeaveRequest[];
}

const MonthlyLeaveChart = ({ data }: MonthlyLeaveChartProps) => {
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    name: format(new Date(0, i), 'MMM'),
    leaves: 0,
  }));

  data.forEach(request => {
    if (request.status === 'Approved') {
      const monthIndex = getMonth(new Date(request.startDate));
      if (monthlyData[monthIndex]) {
        monthlyData[monthIndex].leaves += request.totalDays;
      }
    }
  });

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Monthly Leave Report</CardTitle>
        <CardDescription>Total approved leave days per month for the current year.</CardDescription>
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
            <Bar dataKey="leaves" fill="#8884d8" name="Total Leave Days" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyLeaveChart;