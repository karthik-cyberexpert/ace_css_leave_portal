import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
}

interface NotificationsProps {
  role: 'student' | 'tutor' | 'admin';
}

// Dummy data for demonstration
const studentNotifications: Notification[] = [
  { id: 'stud-notif-1', title: 'OD Request Approved', description: 'Your OD request for the Tech Conference has been approved.', read: false },
  { id: 'stud-notif-2', title: 'Leave Request Rejected', description: 'Your leave request for a vacation has been rejected.', read: false },
  { id: 'stud-notif-3', title: 'System Maintenance', description: 'The portal will be down for maintenance on Sunday at 2 AM.', read: true },
];

const tutorNotifications: Notification[] = [
  { id: 'tutor-notif-1', title: 'New Leave Request', description: 'Alice Johnson has requested 3 days of leave.', read: false },
  { id: 'tutor-notif-2', title: 'Request Forwarded', description: 'Bob Williams\'s leave request was forwarded to the admin.', read: false },
  { id: 'tutor-notif-3', title: 'Student Added', description: 'A new student, Eve, has been assigned to you.', read: true },
];

const adminNotifications: Notification[] = [
  { id: 'admin-notif-1', title: 'Leave Request Forwarded', description: 'A leave request from Bob Williams has been forwarded by Prof. Jones.', read: false },
  { id: 'admin-notif-2', title: 'New Staff Added', description: 'A new tutor, Prof. White, has been added to the system.', read: false },
  { id: 'admin-notif-3', title: 'Bulk Import Complete', description: 'Successfully imported 50 new students.', read: true },
];

const notificationsByRole = {
  student: studentNotifications,
  tutor: tutorNotifications,
  admin: adminNotifications,
};

export const Notifications = ({ role }: NotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(notificationsByRole[role]);
  }, [role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>You have {unreadCount} unread messages.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div className="p-4 hover:bg-accent">
                      <div className="flex items-start gap-4">
                        <div className={cn("h-2 w-2 rounded-full mt-2 flex-shrink-0", !notification.read && "bg-sky-500")} />
                        <div className="grid gap-1 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-muted-foreground text-center">No new notifications.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-2 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
};