import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image, AlertCircle, Loader2, X } from 'lucide-react';

interface CertificateViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateUrl: string | null;
  title?: string;
}

export const CertificateViewer = ({ open, onOpenChange, certificateUrl, title = "Certificate" }: CertificateViewerProps) => {
  const [imageError, setImageError] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!certificateUrl || !open) return null;

  const isImage = certificateUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = certificateUrl.match(/\.pdf$/i);
  const isLocalFile = certificateUrl.startsWith('/uploads/');
  
  // Construct full URL for local files
  const fullUrl = isLocalFile ? `http://localhost:3002${certificateUrl}` : certificateUrl;

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  const handlePdfError = () => {
    setPdfError(true);
    setLoading(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('File not found');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = certificateUrl.split('/').pop() || 'certificate';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download certificate. File may not exist.');
    }
  };

  const renderContent = () => {
    if (isImage && !imageError) {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}
          <img
            src={fullUrl}
            alt="Certificate"
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: loading ? 'none' : 'block' }}
          />
        </div>
      );
    }

    if (isPdf && !pdfError) {
      return (
        <div className="w-full h-[70vh] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}
          <iframe
            src={`${fullUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0 rounded-lg"
            title="PDF Certificate"
            onLoad={() => setLoading(false)}
            onError={handlePdfError}
            style={{ display: loading ? 'none' : 'block' }}
          />
        </div>
      );
    }

    // Error state or unsupported file type
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle size={64} className="text-red-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600">Certificate Not Available</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {imageError || pdfError 
              ? 'The certificate file could not be loaded. It may have been moved or deleted.'
              : 'This file type is not supported for preview.'}
          </p>
          <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
            <Download size={16} />
            Try Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            {isImage ? <Image size={20} /> : <FileText size={20} />}
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0"
          >
            <X size={16} />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4">
          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
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
            {renderContent()}
          </div>

          {/* File info */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            <p>File: {certificateUrl.split('/').pop()}</p>
            {isLocalFile && (
              <p className="text-xs mt-1">Stored on server</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
