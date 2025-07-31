import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCog, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/AdminLayout';
import TutorLayout from '@/components/TutorLayout';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import EditableProfileField from '@/components/EditableProfileField';
import { getBestProfilePicture } from '@/utils/gravatar';

const StaffProfilePage = () => {
  const { profile, user, role, currentTutor, students } = useAppContext();

  const Layout = role === 'Admin' ? AdminLayout : TutorLayout;
  
  if (!profile || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  const displayName = (profile.first_name && profile.last_name) 
    ? `${profile.first_name} ${profile.last_name}` 
    : (currentTutor?.name || 'Staff Member');
  
  const displayUsername = currentTutor?.username || 'N/A';
  const displayEmail = user.email || 'N/A';
  const displayMobile = currentTutor?.mobile || 'N/A';
  
  // Get the best profile picture (custom upload or Gravatar fallback)
  const customProfilePhoto = profile.profile_photo || currentTutor?.profile_photo;
  const avatarSrc = getBestProfilePicture(customProfilePhoto, displayEmail);

  const studentCount = role === 'Tutor' 
    ? students.filter(s => s.tutor_id === profile.id).length 
    : 0;

  return (
    <Layout>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <ProfilePictureUpload
              currentImageSrc={avatarSrc}
              fallbackIcon={role === 'Admin' ? <Shield className="h-12 w-12" /> : <UserCog className="h-12 w-12" />}
              altText={displayName}
              className="h-20 w-20 border-2 border-primary"
              onUploadSuccess={(imageUrl) => {
                // The upload is handled by the component
                // The profile will be refreshed automatically through the context
                console.log('Profile picture uploaded:', imageUrl);
              }}
            />
            <div>
              <CardTitle className="text-3xl font-bold">{displayName}</CardTitle>
              <CardDescription className="text-md">{role} Profile Details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <EditableProfileField 
              label="Email" 
              value={displayEmail} 
              fieldType="email"
              userType={role as 'Admin' | 'Tutor'}
            />
            <EditableProfileField 
              label="Mobile" 
              value={displayMobile} 
              fieldType="mobile"
              userType={role as 'Admin' | 'Tutor'}
              isEditable={displayMobile !== 'N/A'}
            />
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Username</span>
              <p className="font-medium text-base">{displayUsername}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="font-semibold text-muted-foreground">Roles</span>
              <div className="flex gap-2 pt-1">
                {profile.is_admin && <Badge variant="default">Admin</Badge>}
                {profile.is_tutor && <Badge variant="secondary">Tutor</Badge>}
              </div>
            </div>
            {role === 'Tutor' && (
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-muted-foreground">Students Under Guidance</span>
                <p className="font-medium text-base flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {studentCount}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default StaffProfilePage;