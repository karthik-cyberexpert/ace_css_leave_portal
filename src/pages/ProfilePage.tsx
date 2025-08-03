import React from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import EditableProfileField from '@/components/EditableProfileField';

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
            <ProfilePictureUpload
              currentImageSrc={currentUser.profile_photo}
              fallbackIcon={<UserCircle className="h-12 w-12" />}
              altText={currentUser.name}
              className="h-20 w-20 border-2 border-primary"
              onUploadSuccess={(imageUrl) => {
                // The upload is handled by the component
                // The profile will be refreshed automatically through the context
                console.log('Profile picture uploaded:', imageUrl);
              }}
              isEditable={currentUser.is_active}
            />
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
              <span className="font-semibold text-muted-foreground">Academic Year</span>
              <p className="font-medium text-base">{currentUser.batch}-{parseInt(currentUser.batch) + 4}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Current Semester</span>
              <p className="font-medium text-base">Semester {currentUser.semester}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  currentUser.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {currentUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <EditableProfileField 
              label="Email" 
              value={currentUser.email} 
              fieldType="email"
              userType="Student"
              isEditable={currentUser.is_active}
            />
            <EditableProfileField 
              label="Mobile" 
              value={currentUser.mobile} 
              fieldType="mobile"
              userType="Student"
              isEditable={currentUser.is_active}
            />
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