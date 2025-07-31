import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye, Download, FileText, Image } from 'lucide-react';

interface CertificateViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateUrl: string | null;
  title?: string;
}

export const CertificateViewer = ({ open, onOpenChange, certificateUrl, title = "Certificate" }: CertificateViewerProps) => {
  const [imageError, setImageError] = useState(false);

  if (!certificateUrl) return null;

  const isImage = certificateUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = certificateUrl.match(/\.pdf$/i);
  const isLocalFile = certificateUrl.startsWith('/uploads/');
  
  // Construct full URL for local files
  const fullUrl = isLocalFile ? `http://localhost:3002${certificateUrl}` : certificateUrl;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = certificateUrl.split('/').pop() || 'certificate';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImage ? <Image size={20} /> : <FileText size={20} />}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4">
          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </Button>
          </div>

          {/* Certificate display */}
          <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            {isImage && !imageError ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={fullUrl}
                  alt="Certificate"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={handleImageError}
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-[60vh]">
                <iframe
                  src={fullUrl}
                  className="w-full h-full border-0"
                  title="PDF Certificate"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <FileText size={64} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-lg font-semibold">Certificate File</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    This file type cannot be previewed directly.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleOpenInNewTab} className="flex items-center gap-2">
                      <Eye size={16} />
                      View File
                    </Button>
                    <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                      <Download size={16} />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            <p>File: {certificateUrl.split('/').pop()}</p>
            {isLocalFile && (
              <p className="text-xs mt-1">Uploaded to server</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
