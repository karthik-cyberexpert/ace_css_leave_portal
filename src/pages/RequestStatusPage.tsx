import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Dummy data for requests
const initialRequests = [
  {
    id: 'req-1',
    type: 'Leave',
    appliedDate: '2023-10-26',
    subject: 'Family Vacation',
    totalDays: 5,
    status: 'Approved',
    details: 'Vacation to the mountains with family.',
  },
  {
    id: 'req-2',
    type: 'OD',
    appliedDate: '2023-10-20',
    subject: 'Conference Attendance',
    totalDays: 3,
    status: 'Pending',
    details: 'Attending the annual tech conference in New York.',
  },
  {
    id: 'req-3',
    type: 'Leave',
    appliedDate: '2023-09-15',
    subject: 'Sick Leave',
    totalDays: 1,
    status: 'Rejected',
    details: 'Fever and flu symptoms.',
  },
  {
    id: 'req-4',
    type: 'OD',
    appliedDate: '2023-09-01',
    subject: 'Client Meeting',
    totalDays: 2,
    status: 'Approved',
    details: 'Meeting with client in Boston for project discussion.',
  },
  {
    id: 'req-5',
    type: 'Leave',
    appliedDate: '2023-08-28',
    subject: 'Personal Day',
    totalDays: 1,
    status: 'Approved',
    details: 'Personal errands and appointments.',
  },
];

const RequestStatusPage = () => {
  const [requests, setRequests] = useState(initialRequests);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleConfirmCancel = () => {
    if (!requestToCancel || !cancelReason.trim()) return;

    setRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === requestToCancel ? { ...request, status: 'Cancelled' } : request
      )
    );
    console.log(`Request ${requestToCancel} cancelled. Reason: ${cancelReason}`);
    showSuccess('Request cancelled successfully!');
    setRequestToCancel(null);
    setCancelReason('');
  };

  const handleRetryRequest = (id: string) => {
    setRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === id ? { ...request, status: 'Pending' } : request
      )
    );
    showSuccess('Request retried successfully! Status changed to Pending.');
  };

  return (
    <Layout>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">Request Status</CardTitle>
          <CardDescription>View the status of all your submitted leave and OD requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Subject/Purpose</TableHead>
                  <TableHead className="text-right">Total Days</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.type}</TableCell>
                    <TableCell>{request.appliedDate}</TableCell>
                    <TableCell>{request.subject}</TableCell>
                    <TableCell className="text-right">{request.totalDays}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold",
                        request.status === 'Approved' && 'bg-green-100 text-green-800',
                        request.status === 'Pending' && 'bg-yellow-100 text-yellow-800',
                        request.status === 'Rejected' && 'bg-red-100 text-red-800',
                        request.status === 'Cancelled' && 'bg-gray-100 text-gray-800'
                      )}>
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {(request.status === 'Pending' || request.status === 'Approved') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRequestToCancel(request.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      {request.status === 'Rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryRequest(request.id)}
                        >
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!requestToCancel} onOpenChange={(isOpen) => !isOpen && setRequestToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this request. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Type your reason here..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestToCancel(null)}>
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default RequestStatusPage;