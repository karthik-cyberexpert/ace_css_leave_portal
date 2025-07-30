import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
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
  
  // Function to check if a date string represents a Sunday
  const isSunday = (dateString: string): boolean => {
    try {
      // The date format is 'MMM d' (e.g., "Jul 30", "Aug 1")
      // We need to add the current year to parse it correctly
      const currentYear = new Date().getFullYear();
      const dateWithYear = `${dateString} ${currentYear}`;
      
      // Parse the date (e.g., "Jul 30 2025")
      const date = new Date(dateWithYear);
      
      // Check if date is valid and return if it's Sunday (0 = Sunday)
      return !isNaN(date.getTime()) && date.getDay() === 0;
    } catch (error) {
      console.error('Error parsing date for Sunday check:', dateString, error);
      return false;
    }
  };
  
  // Get all Sunday dates from the data
  const sundayDates = safeData.filter(item => isSunday(item.date)).map(item => item.date);
  
  // Debug: Log Sunday dates found
  if (sundayDates.length > 0) {
    console.log('Sunday dates found in chart data:', sundayDates);
  }
  
  const chartWidth = Math.max(safeData.length * 80, 800); // Increased width per bar

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Daily breakdown of students on leave from semester start date to current date.
          {safeData.length > 0 && ` (${safeData.length} days)`}
          {sundayDates.length > 0 && ` • ${sundayDates.length} Sunday${sundayDates.length > 1 ? 's' : ''} marked in red`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto rounded-md border">
          <div style={{ width: `${chartWidth}px`, padding: '10px', minWidth: '100%' }}>
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
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tickCount={6}
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
                {/* Add vertical lines and text for Sundays */}
                {sundayDates.map((sundayDate, index) => {
                  const letters = ['S', 'U', 'N', 'D', 'A', 'Y'];
                  return (
                    <React.Fragment key={`sunday-group-${index}`}>
                      {/* Main vertical line */}
                      <ReferenceLine
                        key={`sunday-line-${index}`}
                        x={sundayDate}
                        stroke="#dc2626"
                        strokeWidth={4}
                      />
                      {/* Individual letters stacked vertically and centered */}
                      {letters.map((letter, letterIndex) => {
                        // Calculate vertical center position
                        // Chart height is approximately 450px, accounting for margins (top: 20, bottom: 60)
                        // Available chart area is about 370px, so center is around 185px from top
                        // Total stack height is 6 letters * 18px = 108px
                        // Start position to center the stack: 185 - (108/2) = 131px
                        const centerY = 131 + (letterIndex * 18);
                        
                        return (
                          <ReferenceLine
                            key={`sunday-${index}-letter-${letterIndex}`}
                            x={sundayDate}
                            stroke="transparent"
                            strokeWidth={0}
                            label={{
                              value: letter,
                              position: "insideTopLeft",
                              dy: centerY, // Center the letters vertically
                              dx: 8,
                              style: {
                                textAnchor: "middle",
                                fontSize: "16px",
                                fontWeight: "bold",
                                fill: "#dc2626",
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                padding: "2px 4px",
                                borderRadius: "3px",
                                fontFamily: "Arial, sans-serif",
                                border: "1px solid rgba(220, 38, 38, 0.2)"
                              }
                            }}
                          />
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {safeData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No data available for the selected period.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
