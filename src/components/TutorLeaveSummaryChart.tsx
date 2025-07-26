import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string; // Tutor's name
  totalLeaves: number;
}

interface TutorLeaveSummaryChartProps {
  data: ChartData[];
  month: string;
}

const TutorLeaveSummaryChart = ({ data, month }: TutorLeaveSummaryChartProps) => {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Tutor Leave Summary for {month}</CardTitle>
        <CardDescription>Total approved leave days by students, grouped by tutor.</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalLeaves" fill="#82ca9d" name="Total Leave Days" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TutorLeaveSummaryChart;