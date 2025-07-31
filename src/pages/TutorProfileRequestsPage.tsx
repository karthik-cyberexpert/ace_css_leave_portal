import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TutorLayout from '@/components/TutorLayout';
import { CheckCircle, XCircle } from 'lucide-react';

const TutorProfileRequestsPage = () => {
  const { profileChangeRequests, updateProfileChangeRequestStatus } = useAppContext();

  const handleDecision = async (id: string, approve: boolean) => {
    try {
      const status = approve ? 'Approved' : 'Rejected';
      await updateProfileChangeRequestStatus(id, status);
    } catch (error) {
      console.error(`Failed to update request status:`, error);
    }
  };

  const pendingRequests = profileChangeRequests.filter(req => req.status === 'Pending');

  return (
    <TutorLayout>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Profile Change Requests</CardTitle>
          <CardDescription>
            Approve or reject profile change requests from your students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending profile change requests.
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="border p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <h4 className="text-lg font-medium">
                      {request.student_name} wants to change their {request.change_type}
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Current:</span>
                      <Badge variant="outline">{request.current_value}</Badge>
                      <span className="text-muted-foreground">→ Requested:</span>
                      <Badge variant="secondary">{request.requested_value}</Badge>
                    </div>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Requested on: {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleDecision(request.id, true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDecision(request.id, false)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </TutorLayout>
  );
};

export default TutorProfileRequestsPage;

