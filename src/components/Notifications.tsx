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
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { differenceInDays, parseISO } from 'date-fns';

export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  href?: string;
}

export const Notifications = ({ role }: { role: 'student' | 'tutor' | 'admin' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const { leaveRequests, odRequests, currentUser, currentTutor, students } = useAppContext();

  useEffect(() => {
    if (!Array.isArray(leaveRequests) || !Array.isArray(odRequests)) return;

    const generatedNotifications: Notification[] = [];
    const now = new Date();

    if (role === 'student' && currentUser) {
      const myLeaveRequests = leaveRequests.filter(r => r.student_id === currentUser.id);
      const myODRequests = odRequests.filter(r => r.student_id === currentUser.id);

      myLeaveRequests.forEach(req => {
        if (differenceInDays(now, parseISO(req.created_at)) <= 7 && (req.status === 'Approved' || req.status === 'Rejected')) {
          generatedNotifications.push({
            id: req.id,
            title: `Leave Request ${req.status}`,
            description: `Your request for "${req.subject}" was ${req.status.toLowerCase()}.`,
            read: false,
            href: '/request-status',
          });
        }
      });
      myODRequests.forEach(req => {
        if (differenceInDays(now, parseISO(req.created_at)) <= 7 && (req.status === 'Approved' || req.status === 'Rejected')) {
          generatedNotifications.push({
            id: req.id,
            title: `OD Request ${req.status}`,
            description: `Your request for "${req.purpose}" was ${req.status.toLowerCase()}.`,
            read: false,
            href: '/request-status',
          });
        }
      });
    } else if (role === 'tutor' && currentTutor && Array.isArray(students)) {
      const myStudentIds = new Set(students.filter(s => s.tutor_id === currentTutor.id).map(s => s.id));
      
      leaveRequests.filter(r => myStudentIds.has(r.student_id)).forEach(req => {
        if (differenceInDays(now, parseISO(req.created_at)) <= 7 && req.status === 'Pending') {
          generatedNotifications.push({
            id: req.id,
            title: `New Leave Request`,
            description: `${req.student_name} has requested ${req.total_days} day(s) for "${req.subject}".`,
            read: false,
            href: '/tutor-leave-approve',
          });
        }
      });
      odRequests.filter(r => myStudentIds.has(r.student_id)).forEach(req => {
        if (differenceInDays(now, parseISO(req.created_at)) <= 7 && req.status === 'Pending') {
          generatedNotifications.push({
            id: req.id,
            title: `New OD Request`,
            description: `${req.student_name} has requested ${req.total_days} day(s) for "${req.purpose}".`,
            read: false,
            href: '/tutor-od-approve',
          });
        }
      });
    } else if (role === 'admin') {
      leaveRequests.filter(r => r.status === 'Forwarded' || r.status === 'Pending').forEach(req => {
        if (differenceInDays(now, parseISO(req.created_at)) <= 7) {
          generatedNotifications.push({
            id: req.id,
            title: req.status === 'Forwarded' ? `Forwarded Leave Request` : `New Leave Request`,
            description: req.status === 'Forwarded' ? 
              `Request from ${req.student_name} forwarded by ${req.tutor_name}.` :
              `New request from ${req.student_name} for "${req.subject}".`,
            read: false,
            href: '/admin-leave-requests',
          });
        }
      });
      odRequests.filter(r => r.status === 'Forwarded' || r.status === 'Pending').forEach(req => {
        if (differenceInDays(now, parseISO(req.created_at)) <= 7) {
          generatedNotifications.push({
            id: req.id,
            title: req.status === 'Forwarded' ? `Forwarded OD Request` : `New OD Request`,
            description: req.status === 'Forwarded' ? 
              `Request from ${req.student_name} forwarded by ${req.tutor_name}.` :
              `New request from ${req.student_name} for "${req.purpose}".`,
            read: false,
            href: '/admin-od-requests',
          });
        }
      });
    }
    
    setNotifications(generatedNotifications.sort((a, b) => b.id.localeCompare(a.id)));

  }, [leaveRequests, odRequests, role, currentUser, currentTutor, students]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    if (notification.href) {
      navigate(notification.href);
    }
  };

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
                    <div
                      className="p-4 hover:bg-accent transition-colors duration-150 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
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