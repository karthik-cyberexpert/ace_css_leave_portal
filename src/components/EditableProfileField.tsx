import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Edit, Check, X, Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';

interface EditableProfileFieldProps {
  label: string;
  value: string;
  fieldType: 'email' | 'mobile';
  userType: 'Student' | 'Admin' | 'Tutor';
  isEditable?: boolean;
  approverType?: string;
  currentId?: string;
}

const EditableProfileField: React.FC<EditableProfileFieldProps> = ({
  label,
  value,
  fieldType,
userType,
  isEditable = true,
  approverType = 'Admin',
  currentId
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newValue, setNewValue] = useState(value);
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateCurrentUserProfile, createProfileChangeRequest } = useAppContext();

  const handleEdit = () => {
    setNewValue(value);
    setReason('');
    setIsDialogOpen(true);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setNewValue(value);
    setReason('');
  };

  const validateInput = (inputValue: string): string | null => {
    if (!inputValue.trim()) {
      return `${label} cannot be empty`;
    }

    if (fieldType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputValue)) {
        return 'Invalid email format';
      }
    }

    if (fieldType === 'mobile') {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(inputValue)) {
        return 'Invalid mobile number. Must be 10 digits starting with 6-9';
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateInput(newValue);
    if (validationError) {
      showError(validationError);
      return;
    }

    if (newValue === value) {
      showError('No changes made');
      return;
    }

    // All users need to provide a reason for profile changes
    if (!reason.trim()) {
      showError('Please provide a reason for the change');
      return;
    }

    setIsUpdating(true);
    try {
      // Directly update the user profile
      await updateCurrentUserProfile({ [fieldType]: newValue });
      showSuccess(`${label} updated successfully`);
      
      // Notify tutor and admin of the change
      try {
        const notificationMessage = `${label} changed from '${value}' to '${newValue}' by the user. Reason: ${reason}`;
        const apiClient = axios.create({
          baseURL: 'http://localhost:3002',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });
        await apiClient.post('/notifications/profile-change', { 
          changeType: fieldType,
          oldValue: value,
          newValue: newValue,
          reason: reason,
          message: notificationMessage 
        });
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Don't fail the entire operation if notification fails
      }
      
      setIsDialogOpen(false);
      setNewValue('');
      setReason('');
    } catch (error) {
      // Error handling is done in the context methods
      console.error(`Failed to update ${fieldType}:`, error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getInputType = () => {
    switch (fieldType) {
      case 'email':
        return 'email';
      case 'mobile':
        return 'tel';
      default:
        return 'text';
    }
  };

  const getPlaceholder = () => {
    switch (fieldType) {
      case 'email':
        return 'Enter your email address';
      case 'mobile':
        return 'Enter your mobile number';
      default:
        return `Enter your ${label.toLowerCase()}`;
    }
  };

  if (!isEditable) {
    return (
      <div className="flex flex-col space-y-1">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <p className="font-medium text-base">{value}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-1">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <div className="flex items-center justify-between group">
          <p className="font-medium text-base">{value}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-auto"
            aria-label={`Edit ${label}`}
          >
            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {label}</DialogTitle>
            <DialogDescription>
              Update your {label.toLowerCase()}. Tutors and admins will be automatically notified of this change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`new-${fieldType}`}>New {label}</Label>
              <Input
                id={`new-${fieldType}`}
                type={getInputType()}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={getPlaceholder()}
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Change *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need to change this information"
                disabled={isUpdating}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Update Profile
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditableProfileField;
