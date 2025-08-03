import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface CertificateViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateUrl: string | null;
  title?: string;
}

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  open,
  onOpenChange,
  certificateUrl,
  title = "Certificate"
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handlePdfError = () => {
    setPdfError(true);
  };

  const handleDownload = async () => {
    if (!certificateUrl) return;
    
    const directUrl = getCertificateApiUrl(certificateUrl);
    if (!directUrl) return;
    
    try {
      const response = await fetch(directUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.${getFileExtension(certificateUrl)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  const getFileExtension = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'file';
  };

  const isImage = (url: string): boolean => {
    const extension = getFileExtension(url);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
  };

  const isPdf = (url: string): boolean => {
    const extension = getFileExtension(url);
    return extension === 'pdf';
  };

  // Helper function to get certificate via backend static serving
  const getCertificateApiUrl = (certificateUrl: string | null): string | null => {
    if (!certificateUrl) return null;
    
    // The certificateUrl from database already includes '/uploads/' prefix
    // Backend serves static files from /uploads route
    // So we just need to prepend the server URL
    if (certificateUrl.startsWith('/uploads/')) {
      return `http://localhost:3002${certificateUrl}`;
    }
    
    // If it doesn't start with /uploads/, add it
    return `http://localhost:3002/uploads/${certificateUrl}`;
  };

  const renderContent = () => {
    if (!certificateUrl) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No certificate available
        </div>
      );
    }

    const directUrl = getCertificateApiUrl(certificateUrl);
    if (!directUrl) {
      return (
        <div className="flex items-center justify-center h-64 text-red-500">
          Invalid certificate URL
        </div>
      );
    }

    if (isImage(certificateUrl)) {
      return (
        <div className="flex flex-col items-center space-y-4">
          {!imageLoaded && !imageError && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Loading image...
            </div>
          )}
          {imageError && (
            <div className="flex items-center justify-center h-64 text-red-500">
              Failed to load image. URL: {directUrl}
            </div>
          )}
          <img
            src={directUrl}
            alt={title}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`max-w-full max-h-[70vh] object-contain ${!imageLoaded ? 'hidden' : ''}`}
          />
        </div>
      );
    }

    if (isPdf(certificateUrl)) {
      return (
        <div className="flex flex-col space-y-4">
          {!pdfError ? (
            <iframe
              src={directUrl}
              title={title}
              className="w-full h-[70vh] border rounded"
              onError={handlePdfError}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-red-500">
              <p>Failed to load PDF</p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </div>
      );
    }

    // For other file types, show download option
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-500">Certificate file format not supported for preview</p>
        <Button onClick={handleDownload} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Certificate
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle>{title}</DialogTitle>
          <div className="flex items-center space-x-2">
            {certificateUrl && (
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
