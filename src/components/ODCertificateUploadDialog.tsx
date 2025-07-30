import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext, ODRequest } from '@/context/AppContext';
import { Upload, Link, Eye } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ODCertificateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  odRequest: ODRequest | null;
}

export const ODCertificateUploadDialog = ({ open, onOpenChange, odRequest }: ODCertificateUploadDialogProps) => {
  const { uploadODCertificate } = useAppContext();
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a blob URL for the file
      const fileUrl = URL.createObjectURL(file);
      setCertificateUrl(fileUrl);
    }
  };

  const handleSubmit = async () => {
    if (!odRequest || !certificateUrl) return;

    setIsUploading(true);
    try {
      await uploadODCertificate(odRequest.id, certificateUrl);
      setCertificateUrl('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to upload certificate:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!odRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload OD Certificate</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Request Details</Label>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm">
              <p><strong>Purpose:</strong> {odRequest.purpose}</p>
              <p><strong>Destination:</strong> {odRequest.destination}</p>
              <p><strong>Duration:</strong> {odRequest.start_date} to {odRequest.end_date}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Upload Method</Label>
            <ToggleGroup
              type="single"
              value={uploadMode}
              onValueChange={(value: 'url' | 'file') => {
                if (value) {
                  setUploadMode(value);
                  setCertificateUrl('');
                }
              }}
              className="mb-3"
            >
              <ToggleGroupItem value="url" className="flex items-center gap-2">
                <Link size={16} />
                URL
              </ToggleGroupItem>
              <ToggleGroupItem value="file" className="flex items-center gap-2">
                <Upload size={16} />
                Upload File
              </ToggleGroupItem>
            </ToggleGroup>

            {uploadMode === 'url' ? (
              <div>
                <Input
                  type="url"
                  placeholder="https://example.com/certificate.pdf"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                />
                {certificateUrl && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-2">
                    <Eye size={14} />
                    File ready for upload
                  </p>
                )}
              </div>
            )}
          </div>

          {certificateUrl && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> Once uploaded, your certificate will be sent for verification. 
                You'll be notified of the verification status.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!certificateUrl || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload Certificate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
