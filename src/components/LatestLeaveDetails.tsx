import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Dummy data for latest leave details
const latestLeaves = [
  { id: '1', appliedDate: '2023-10-26', status: 'Approved', totalDays: 3 },
  { id: '2', appliedDate: '2023-10-20', status: 'Pending', totalDays: 1 },
  { id: '3', appliedDate: '2023-09-15', status: 'Rejected', totalDays: 2 },
];

const LatestLeaveDetails = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Latest Leave Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applied Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestLeaves.map((leave) => (
              <TableRow key={leave.id}>
                <TableCell className="font-medium">{leave.appliedDate}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {leave.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">{leave.totalDays}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LatestLeaveDetails;