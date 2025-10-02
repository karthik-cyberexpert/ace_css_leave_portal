import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { CalendarOff } from 'lucide-react';

interface AbsentStudent {
  id: string;
  name: string;
  register_number: string;
  batch: string;
  semester: number;
  status: 'On Leave' | 'On OD';
  requestId?: string;
}

interface AbsentStudentsTableProps {
  absentStudents: AbsentStudent[];
  currentDate: string;
  selectedBatch?: string;
}

export const AbsentStudentsTable: React.FC<AbsentStudentsTableProps> = ({
  absentStudents,
  currentDate,
  selectedBatch = 'all'
}) => {
  const getBatchDisplayName = (batch: string) => `${batch}-${parseInt(batch) + 4}`;

  if (absentStudents.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Student Status for {format(new Date(currentDate), 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>
            View current leave and OD status for students
            {selectedBatch !== 'all' && ` in Batch ${getBatchDisplayName(selectedBatch)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CalendarOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No students are absent today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          Student Status for {format(new Date(currentDate), 'MMMM d, yyyy')}
        </CardTitle>
        <CardDescription>
          View current leave and OD status for students
          {selectedBatch !== 'all' && ` in Batch ${getBatchDisplayName(selectedBatch)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Register Number</TableHead>
                <TableHead className="text-center">Batch</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absentStudents.map((student) => (
                <TableRow key={student.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.register_number}</TableCell>
                  <TableCell className="text-center">{getBatchDisplayName(student.batch)}</TableCell>
                  <TableCell className="text-center">{student.semester}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={student.status === 'On Leave' ? 'destructive' : 'secondary'}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
