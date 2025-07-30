import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DailyChartData {
  date: string;
  studentsOnLeave: number;
}

interface DailyLeaveChartProps {
  data: DailyChartData[];
  title: string;
}

export const DailyLeaveChart = ({ data, title }: DailyLeaveChartProps) => {
  // Safety check: ensure data is valid array
  const safeData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item === 'object' && 
    typeof item.date === 'string' && 
    typeof item.studentsOnLeave === 'number' &&
    !isNaN(item.studentsOnLeave)
  ) : [];
  
  const chartWidth = Math.max(safeData.length * 80, 800); // Increased width per bar

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Daily breakdown of students on leave from semester start date to current date.
          {safeData.length > 0 && ` (${safeData.length} days)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div style={{ width: `${chartWidth}px`, padding: '10px' }}>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart 
                data={safeData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis 
                  allowDecimals={false}
                  label={{ value: 'Students on Leave', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (typeof value === 'number') {
                      return [value, 'Students on Leave'];
                    }
                    return [String(value || 0), 'Students on Leave'];
                  }}
                  labelFormatter={(label: any) => {
                    if (typeof label === 'string') {
                      return `Date: ${label}`;
                    }
                    return `Date: ${String(label || '')}`;
                  }}
                  contentStyle={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
                <Bar 
                  dataKey="studentsOnLeave" 
                  fill="#3b82f6" 
                  name="Students on Leave"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ScrollArea>
        {safeData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No data available for the selected period.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
