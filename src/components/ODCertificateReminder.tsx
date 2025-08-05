import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { FileUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';

const ODCertificateReminder = () => {
  const { odRequests, currentUser } = useAppContext();

  const pendingUploads = odRequests.filter(req =>
    req.student_id === currentUser.id &&
    req.status === 'Approved' &&
    req.certificate_status === 'Pending Upload'
  );

  if (pendingUploads.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
          <AlertTriangle />
          Action Required: Upload OD Certificates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingUploads.map(req => {
          const deadline = parseISO(req.upload_deadline!);
          const daysRemaining = differenceInDays(deadline, new Date());
          return (
            <Alert key={req.id} variant="default" className="bg-white dark:bg-gray-800">
              <FileUp className="h-4 w-4" />
              <AlertTitle>OD for: {req.purpose}</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                <span>
                  Please upload your certificate by <strong>{format(deadline, 'PPP')}</strong>.
                  ({daysRemaining >= 0 ? `${daysRemaining} days remaining` : 'Overdue'})
                </span>
                <Button asChild size="sm">
                  <Link to={`/request-status?highlight=${req.id}`}>Upload Now</Link>
                </Button>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ODCertificateReminder;