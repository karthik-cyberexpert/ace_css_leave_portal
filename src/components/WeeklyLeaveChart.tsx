import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface WeeklyLeaveChartProps {
  data: { week: string; students: number; studentsOnOD: number }[];
  currentMonth?: Date;
  selectedBatch?: string;
  batchOptions?: string[];
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onBatchChange?: (batch: string) => void;
  isNextMonthDisabled?: boolean;
}

const batchColors = [
  '#3b82f6', // Professional Blue
  '#10b981', // Professional Emerald
  '#f59e0b', // Professional Amber
  '#ef4444', // Professional Red
  '#8b5cf6', // Professional Violet
  '#06b6d4', // Professional Cyan
  '#84cc16', // Professional Lime
  '#f97316'  // Professional Orange
];

const WeeklyLeaveChart = ({ 
  data, 
  currentMonth = new Date(), 
  selectedBatch = 'all', 
  batchOptions = ['all'], 
  onPrevMonth, 
  onNextMonth, 
  onBatchChange, 
  isNextMonthDisabled = false 
}: WeeklyLeaveChartProps) => {
  
  const uniqueBatches = batchOptions.filter(b => b !== 'all');
  
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value} students`}
            </p>
          ))}
          <p className="text-xs text-slate-500 mt-1">
            Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)} students
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-1 lg:col-span-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Student Leave & OD Statistics
            </CardTitle>
            <CardDescription>
              Weekly breakdown for {format(currentMonth, 'MMMM yyyy')} - 
              {batchOptions.length > 0 ? 
                (selectedBatch === 'all' ? 'All Batches' : `Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}`) : 
                `Batch ${selectedBatch}-${parseInt(selectedBatch) + 4}`
              }
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Batch Selector - only show if there are batch options */}
            {batchOptions.length > 0 && (
              <Select value={selectedBatch} onValueChange={onBatchChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {batchOptions.map(batch => (
                    <SelectItem key={batch} value={batch}>
                      {batch === 'all' ? 'All Batches' : `Batch ${batch}-${parseInt(batch) + 4}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Month Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevMonth}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextMonth}
                disabled={isNextMonthDisabled}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis allowDecimals={false} />
            <Tooltip content={selectedBatch === 'all' ? customTooltip : undefined} />
            <Legend />
            {selectedBatch === 'all' ? (
              uniqueBatches.map((batch, index) => (
                <Bar 
                  key={batch}
                  dataKey={`batch_${batch}`}
                  fill={batchColors[index % batchColors.length]}
                  name={`Batch ${batch}-${parseInt(batch) + 4}`}
                />
              ))
            ) : (
              <>
                <Bar dataKey="students" fill="#3b82f6" name="Students on Leave" />
                <Bar dataKey="studentsOnOD" fill="#10b981" name="Students on OD" />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WeeklyLeaveChart;