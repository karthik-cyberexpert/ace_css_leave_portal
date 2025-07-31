import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

interface ProfilePictureHandlerProps {
  userId: string;
  profilePhotoUrl?: string; // URL of the profile photo within the uploads directory
  fallbackIcon: React.ReactNode;
  altText: string;
  isEditable: boolean;
}

const ProfilePictureHandler: React.FC<ProfilePictureHandlerProps> = ({
  userId,
  profilePhotoUrl,
  fallbackIcon,
  altText,
  isEditable,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { uploadProfilePhoto, removeProfilePhoto } = useAppContext();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    try {
      const uploadedUrl = await uploadProfilePhoto(file);
      console.log(`Profile photo uploaded to: ${uploadedUrl}`);
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await removeProfilePhoto();
      console.log('Profile photo removed');
    } catch (error) {
      console.error('Failed to remove photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-picture-handler">
      <Avatar>
        <AvatarImage src={profilePhotoUrl} alt={altText} />
        <AvatarFallback>{fallbackIcon}</AvatarFallback>
      </Avatar>
      {isEditable && (
        <div className="actions">
          <input type="file" accept="image/*" onChange={handleUpload} hidden />
          <Button onClick={handleRemove} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureHandler;

