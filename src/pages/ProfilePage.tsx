import React from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

const ProfilePage = () => {
  const { currentUser, staff, user } = useAppContext();

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  const tutor = staff.find(s => s.id === currentUser.tutor_id);

  return (
    <Layout>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={currentUser.profile_photo} alt={currentUser.name} />
              <AvatarFallback className="text-3xl">
                <UserCircle className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold">{currentUser.name}</CardTitle>
              <CardDescription className="text-md">Student Profile Details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Register Number</span>
              <p className="font-medium text-base">{currentUser.register_number}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Year</span>
              <p className="font-medium text-base">{currentUser.year}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Email</span>
              <p className="font-medium text-base">{user?.email}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Username</span>
              <p className="font-medium text-base">{currentUser.username}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Tutor</span>
              <p className="font-medium text-base">{tutor ? tutor.name : 'Not Assigned'}</p>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Total Leaves Taken</span>
              <p className="font-medium text-base">{currentUser.leave_taken}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ProfilePage;