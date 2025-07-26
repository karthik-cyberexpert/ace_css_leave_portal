import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

const initialODRequests = [
  { id: 'od-1', studentName: 'Grace Hall', startDate: '2023-11-06', endDate: '2023-11-09', totalDays: 4, purpose: 'Inter-college Sports Meet', destination: 'City Sports Complex', description: 'Representing the college in the regional basketball tournament.', status: 'Forwarded' },
  { id: 'od-2', studentName: 'Kevin White', startDate: '2023-11-25', endDate: '2023-11-28', totalDays: 4, purpose: 'National Hackathon', destination: 'Tech University', description: 'Participating in the national level hackathon event.', status: 'Forwarded' },
  { id: 'od-3', studentName: 'Frank Green', startDate: '2023-11-03', endDate: '2023-11-03', totalDays: 1, purpose: 'Attend Tech Symposium', destination: 'Main Auditorium', description: 'Presenting a paper at the annual tech symposium.', status: 'Pending' },
  { id: 'od-4', studentName: 'Ivy Scott', startDate: '2023-11-14', endDate: '2023-11-16', totalDays: 3, purpose: 'National Science Fair', destination: 'Capital City Convention Center', description: 'Selected to present my project.', status: 'Approved' },
];

type ODRequest = typeof initialODRequests[0];

const AdminODApprovePage = () => {
  const [odRequests, setODRequests] = useState(initialODRequests);
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);

  const handleRequestAction = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setODRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    showSuccess(`Request has been ${newStatus.toLowerCase()}!`);
    setSelectedRequest(null);
  };

  return (
    <AdminLayout>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold">Admin OD Management</CardTitle>
          <CardDescription>Review, approve, or reject all student OD requests, including those forwarded by tutors.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {odRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.studentName}</TableCell>
                    <TableCell>{request.purpose}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", request.status === 'Approved' && 'bg-green-100 text-green-800', request.status === 'Pending' && 'bg-yellow-100 text-yellow-800', request.status === 'Rejected' && 'bg-red-100 text-red-800', request.status === 'Forwarded' && 'bg-blue-100 text-blue-800')}>
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {request.status === 'Pending' || request.status === 'Forwarded' ? (
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>Review</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No actions</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
        <DialogContent>
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>OD Request Details</DialogTitle>
                <DialogDescription>From: <strong>{selectedRequest.studentName}</strong></DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p><strong>Purpose:</strong> {selectedRequest.purpose}</p>
                <p><strong>Place to Visit:</strong> {selectedRequest.destination}</p>
                <p><strong>Description:</strong> {selectedRequest.description}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleRequestAction(selectedRequest.id, 'Rejected')}>Reject</Button>
                <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleRequestAction(selectedRequest.id, 'Approved')}>Approve</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminODApprovePage;