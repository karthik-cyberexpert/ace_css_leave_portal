import React, { useRef, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Camera, Upload, X, Loader2, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useAppContext } from '@/context/AppContext';
import { getBestProfilePicture } from '@/utils/gravatar';

interface ProfilePictureUploadProps {
  currentImageSrc?: string;
  email?: string; // Email for Gravatar lookup
  fallbackIcon: React.ReactNode;
  altText: string;
  className?: string;
  onUploadSuccess?: (imageUrl: string) => void;
  isEditable?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageSrc,
  fallbackIcon,
  altText,
  className = "h-20 w-20 border-2 border-primary",
  onUploadSuccess,
  isEditable = true
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [displayImageSrc, setDisplayImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadProfilePhoto, removeProfilePhoto } = useAppContext();

  // Update display image source when currentImageSrc changes
  useEffect(() => {
    if (currentImageSrc) {
      // Use centralized URL configuration for server files
      if (currentImageSrc.startsWith('/uploads/') || !currentImageSrc.startsWith('http')) {
        setDisplayImageSrc(getServerFileUrl(currentImageSrc));
      } else {
        setDisplayImageSrc(currentImageSrc);
      }
    } else {
      setDisplayImageSrc(null);
    }
  }, [currentImageSrc]);

  const handleAvatarClick = () => {
    if (isEditable) {
      setIsDialogOpen(true);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadProfilePhoto(selectedFile);
      showSuccess('Profile picture updated successfully!');
      
      if (onUploadSuccess) {
        onUploadSuccess(imageUrl);
      }
      
      handleCloseDialog();
    } catch (error: any) {
      showError(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeProfilePhoto();
      showSuccess('Profile picture removed successfully!');
      handleCloseDialog();
    } catch (error: any) {
      showError(error.message || 'Failed to remove profile picture');
    } finally {
      setIsRemoving(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className={`relative group ${isEditable ? 'cursor-pointer' : 'cursor-default'}`} onClick={handleAvatarClick}>
        <Avatar className={className}>
          <AvatarImage src={displayImageSrc} alt={altText} />
          <AvatarFallback className="text-3xl">
            {fallbackIcon}
          </AvatarFallback>
        </Avatar>
        
        {/* Hover overlay - only show for editable profiles */}
        {isEditable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Choose a new profile picture. Supported formats: JPG, PNG, GIF. Maximum size: 5MB.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4">
            {/* Current/Preview Image */}
            <Avatar className="h-32 w-32 border-2 border-primary">
              <AvatarImage 
                src={previewUrl || displayImageSrc} 
                alt="Profile preview" 
              />
              <AvatarFallback className="text-4xl">
                {fallbackIcon}
              </AvatarFallback>
            </Avatar>

            {/* File Input (Hidden) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex flex-col w-full space-y-2">
              <Button 
                onClick={triggerFileSelect} 
                variant="outline" 
                className="w-full"
                disabled={isUploading || isRemoving}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose New Picture
              </Button>

              {/* Remove button - only show if there's a current image */}
              {displayImageSrc && (
                <Button 
                  onClick={handleRemove} 
                  variant="destructive" 
                  className="w-full"
                  disabled={isUploading || isRemoving}
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Current Picture
                    </>
                  )}
                </Button>
              )}

              {selectedFile && (
                <div className="text-sm text-muted-foreground text-center">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleCloseDialog}
              disabled={isUploading || isRemoving}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Update Picture
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePictureUpload;
