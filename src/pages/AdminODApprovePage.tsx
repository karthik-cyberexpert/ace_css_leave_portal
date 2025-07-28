import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { showSuccess } from '@/utils/toast';
import { useAppContext, ODRequest, RequestStatus, CertificateStatus } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const AdminODApprovePage = () => {
  const { odRequests, updateODRequestStatus, verifyODCertificate, approveRejectODCancellation } = useAppContext();
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);
  const [verifyRequest, setVerifyRequest] = useState<ODRequest | null>(null);

  const handleRequestAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    await updateODRequestStatus(id, newStatus);
    showSuccess(`Request has been ${newStatus.toLowerCase()}!`);
    setSelectedRequest(null);
  };

  const handleCancellationAction = async (id: string, approve: boolean) => {
    await approveRejectODCancellation(id, approve);
    setSelectedRequest(null);
  };

  const handleVerification = (isApproved: boolean) => {
    if (!verifyRequest) return;
    verifyODCertificate(verifyRequest.id, isApproved);
    showSuccess(`Certificate has been ${isApproved ? 'approved' : 'rejected'}.`);
    setVerifyRequest(null);
  };

  const getStatusBadge = (status: RequestStatus, certStatus?: CertificateStatus) => {
    const statusText = certStatus ? `${status} (${certStatus})` : status;
    const colorClasses = {
      'Approved': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800',
      'Forwarded': 'bg-blue-100 text-blue-800',
      'Cancellation Pending': 'bg-purple-100 text-purple-800',
      'Pending Upload': 'bg-orange-100 text-orange-800',
      'Pending Verification': 'bg-purple-100 text-purple-800',
      'Overdue': 'bg-red-200 text-red-900',
    };
    return <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", colorClasses[status as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800')}>{statusText}</span>;
  };

  return (
    <AdminLayout>
      <Card>
        <CardHeader><CardTitle>Admin OD Management</CardTitle><CardDescription>Review, manage, and verify all student OD requests.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {odRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div>{request.student_name}</div>
                      <div className="text-xs text-muted-foreground">[{request.student_register_number}]</div>
                    </TableCell>
                    <TableCell>{request.purpose}</TableCell>
                    <TableCell>{getStatusBadge(request.status, request.certificate_status)}</TableCell>
                    <TableCell><Badge variant={request.certificate_status === 'Approved' ? 'default' : 'outline'}>{request.certificate_status || 'N/A'}</Badge></TableCell>
                    <TableCell className="text-center space-x-2">
                      {request.status === 'Approved' && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleRequestAction(request.id, 'Rejected')}
                        >
                          Reject
                        </Button>
                      )}
                      {(request.status === 'Pending' || request.status === 'Forwarded' || request.status === 'Cancellation Pending') && <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>Review</Button>}
                      {request.certificate_status === 'Pending Verification' && <Button variant="default" size="sm" onClick={() => setVerifyRequest(request)}>Verify Cert</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
        <DialogContent>
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>OD Request Details</DialogTitle>
                <DialogDescription>From: <strong>{selectedRequest.student_name}</strong> [{selectedRequest.student_register_number}]</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Dates</span>
                  <p>{format(parseISO(selectedRequest.start_date), 'MMMM d, yyyy')} to {format(parseISO(selectedRequest.end_date), 'MMMM d, yyyy')} ({selectedRequest.total_days} days)</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Purpose</span>
                  <p>{selectedRequest.purpose}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Destination</span>
                  <p>{selectedRequest.destination}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Description</span>
                  <p>{selectedRequest.description}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                  {getStatusBadge(selectedRequest.status, selectedRequest.certificate_status)}
                </div>
                {selectedRequest.original_status && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Original Status</span>
                    {getStatusBadge(selectedRequest.original_status)}
                  </div>
                )}
                {selectedRequest.cancel_reason && (
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Cancellation Reason</span>
                    <p>{selectedRequest.cancel_reason}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                {selectedRequest.status === 'Cancellation Pending' ? (
                  <>
                    <Button variant="destructive" onClick={() => handleCancellationAction(selectedRequest.id, false)}>Reject Cancellation</Button>
                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleCancellationAction(selectedRequest.id, true)}>Approve Cancellation</Button>
                  </>
                ) : (
                  <>
                    <Button variant="destructive" onClick={() => handleRequestAction(selectedRequest.id, 'Rejected')}>Reject</Button>
                    <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleRequestAction(selectedRequest.id, 'Approved')}>Approve</Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={!!verifyRequest} onOpenChange={(isOpen) => !isOpen && setVerifyRequest(null)}>
        <DialogContent>{verifyRequest && (<><DialogHeader><DialogTitle>Verify Certificate</DialogTitle><DialogDescription>For: <strong>{verifyRequest.purpose}</strong> by {verifyRequest.student_name} [{verifyRequest.student_register_number}]</DialogDescription></DialogHeader><div className="py-4"><a href={verifyRequest.certificate_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Uploaded Certificate</a></div><DialogFooter><Button variant="destructive" onClick={() => handleVerification(false)}>Reject</Button><Button onClick={() => handleVerification(true)}>Approve</Button></DialogFooter></>)}</DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminODApprovePage;