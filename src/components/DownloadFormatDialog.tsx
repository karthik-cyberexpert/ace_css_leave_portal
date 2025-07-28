import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, FileJson } from 'lucide-react';

interface DownloadFormatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (format: 'xlsx' | 'csv' | 'json') => void;
}

export const DownloadFormatDialog: React.FC<DownloadFormatDialogProps> = ({ open, onOpenChange, onDownload }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Template File</DialogTitle>
          <DialogDescription>
            Choose the format for the template file. Use this template to fill in student data for bulk uploading.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
          <Button variant="outline" onClick={() => onDownload('xlsx')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> XLSX
          </Button>
          <Button variant="outline" onClick={() => onDownload('csv')}>
            <FileText className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => onDownload('json')}>
            <FileJson className="mr-2 h-4 w-4" /> JSON
          </Button>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};