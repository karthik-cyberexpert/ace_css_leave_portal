import React, { useState, useMemo } from 'react';
import TutorLayout from '@/components/TutorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CertificateViewer } from '@/components/CertificateViewer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { useAppContext, ODRequest, RequestStatus, CertificateStatus } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Eye } from 'lucide-react';

const TutorODApprovePage = () => {
  const { odRequests, updateODRequestStatus, currentTutor, verifyODCertificate, approveRejectODCancellation, students } = useAppContext();
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);
  const [verifyRequest, setVerifyRequest] = useState<ODRequest | null>(null);
  const [viewCertificate, setViewCertificate] = useState<string | null>(null);

  const tutorODRequests = useMemo(() => {
    return odRequests.filter(req => req.tutor_id === currentTutor.id);
  }, [odRequests, currentTutor.id]);

  const getStudentInfo = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? { batch: student.batch, semester: student.semester } : { batch: 'N/A', semester: 'N/A' };
  };

  const handleRequestAction = async (id: string, newStatus: RequestStatus) => {
    await updateODRequestStatus(id, newStatus);
    showSuccess(`Request has been ${newStatus.toLowerCase()}!`);
    setSelectedRequest(null);
  };

  const handleCancellationAction = async (id: string, approve: boolean) => {
    await approveRejectODCancellation(id, approve);
    setSelectedRequest(null);
  };

  const handleVerification = async (isApproved: boolean) => {
    if (!verifyRequest) return;
    await verifyODCertificate(verifyRequest.id, isApproved);
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
      'Retried': 'bg-orange-100 text-orange-800',
      'Pending Upload': 'bg-orange-100 text-orange-800',
      'Pending Verification': 'bg-purple-100 text-purple-800',
      'Overdue': 'bg-red-200 text-red-900',
    };
    return <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", colorClasses[status as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800')}>{statusText}</span>;
  };

  return (
    <TutorLayout>
      <Card>
        <CardHeader><CardTitle>On Duty (OD) Approval</CardTitle><CardDescription>Review, manage, and verify student OD requests.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Batch</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutorODRequests.map((request) => {
                  const studentInfo = getStudentInfo(request.student_id);
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        <div>{request.student_name}</div>
                        <div className="text-xs text-muted-foreground">[{request.student_register_number}]</div>
                      </TableCell>
                      <TableCell className="text-center">{studentInfo.batch}-{studentInfo.batch !== 'N/A' ? parseInt(studentInfo.batch) + 4 : 'N/A'}</TableCell>
                      <TableCell className="text-center">{studentInfo.semester}</TableCell>
                      <TableCell>{request.purpose}</TableCell>
                    <TableCell>{getStatusBadge(request.status, request.certificate_status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={request.certificate_status === 'Approved' ? 'default' : 'outline'}>
                          {request.certificate_status || 'N/A'}
                        </Badge>
                        {request.certificate_url && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
onClick={() => setViewCertificate(request.certificate_url!)}
                            className="h-6 w-6 p-0"
                          >
                            <Eye size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
                      {(request.status === 'Pending' || request.status === 'Retried' || request.status === 'Cancellation Pending') && <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>Review</Button>}
                      {request.certificate_status === 'Pending Verification' && <Button variant="default" size="sm" onClick={() => setVerifyRequest(request)}>Verify Cert</Button>}
                    </TableCell>
                    </TableRow>
                  );
                })}
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
                  <span className="text-sm font-medium text-muted-foreground">Date</span>
{format(parseISO(selectedRequest.start_date), 'MMMM d yyyy')} to {format(parseISO(selectedRequest.end_date), 'MMMM d yyyy')} ({selectedRequest.total_days} days)
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
        <DialogContent>
          {verifyRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Verify Certificate</DialogTitle>
                <DialogDescription>
                  For: <strong>{verifyRequest.purpose}</strong> by {verifyRequest.student_name} [{verifyRequest.student_register_number}]
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {verifyRequest.certificate_url ? (
                  <>
                    <p className="text-sm text-gray-600">Click the button below to view the uploaded certificate:</p>
                    <Button 
onClick={() => setViewCertificate(verifyRequest.certificate_url!)}
                      className="flex items-center gap-2"
                    >
                      <Eye size={16} />
                      View Certificate
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-red-600">No certificate uploaded yet.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setVerifyRequest(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleVerification(false)}>Reject</Button>
                <Button onClick={() => handleVerification(true)}>Approve</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Certificate Viewer Dialog */}
      <CertificateViewer
        open={!!viewCertificate}
        onOpenChange={() => setViewCertificate(null)}
        certificateUrl={viewCertificate}
        title="OD Certificate"
      />
    </TutorLayout>
  );
};

export default TutorODApprovePage;