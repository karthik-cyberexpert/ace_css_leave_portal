import { format, eachDayOfInterval } from 'date-fns';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Types
export interface ReportData {
  date?: string;
  studentsOnLeave?: number;
  studentsOnOD?: number;
  totalAbsent?: number;
  [key: string]: any;
}

export interface ReportFilters {
  batch?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  type?: 'daily' | 'summary';
}

export interface ReportMetadata {
  generatedAt: string;
  generatedBy: string;
  filters: ReportFilters;
  totalRecords: number;
}

export interface ServerReportResponse {
  success: boolean;
  metadata: ReportMetadata;
  data: ReportData[];
}

// API Client for server-side reports
export class ReportApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = '/api', token?: string) {
    this.baseUrl = baseUrl;
    this.token = token || this.getTokenFromStorage();
  }

  private getTokenFromStorage(): string {
    return localStorage.getItem('token') || '';
  }

  private async makeRequest(endpoint: string, params: URLSearchParams = new URLSearchParams()): Promise<any> {
    const url = `${this.baseUrl}${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getReportData(filters: ReportFilters): Promise<ServerReportResponse> {
    const params = new URLSearchParams();
    
    if (filters.batch) params.set('batch', filters.batch);
    if (filters.semester) params.set('semester', filters.semester);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.type) params.set('type', filters.type);
    params.set('format', 'json');

    return this.makeRequest('/reports/data', params);
  }

  async getReportStats(batch?: string, semester?: string) {
    const params = new URLSearchParams();
    if (batch) params.set('batch', batch);
    if (semester) params.set('semester', semester);

    return this.makeRequest('/reports/stats', params);
  }

  async downloadReportAsCsv(filters: ReportFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.batch) params.set('batch', filters.batch);
    if (filters.semester) params.set('semester', filters.semester);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.type) params.set('type', filters.type);
    params.set('format', 'csv');

    const url = `${this.baseUrl}/reports/data?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }
}

// Enhanced local report generator with zero-data handling
export class EnhancedReportGenerator {
  private apiClient: ReportApiClient;

  constructor(token?: string) {
    this.apiClient = new ReportApiClient('/api', token);
  }

  // Generate default data structure when no data is available
  private generateDefaultData(filters: ReportFilters): ReportData[] {
    if (filters.type === 'daily' && filters.startDate && filters.endDate) {
      const days = eachDayOfInterval({
        start: new Date(filters.startDate),
        end: new Date(filters.endDate)
      });
      
      return days.map(day => ({
        date: format(day, 'MMM d'),
        studentsOnLeave: 0,
        studentsOnOD: 0,
        totalAbsent: 0
      }));
    }

    // Enhanced default summary structure with detailed columns
    return [{
      'Name': 'No Data Available',
      'Register Number': 'N/A',
      'Batch': filters.batch || 'N/A',
      'Semester': filters.semester || 'N/A',
      'Total Leave Count': '0.0',
      'Total OD Count': '0.0',
      'Tutor': 'N/A',
      'Email': 'N/A',
      'Phone': 'N/A'
    }];
  }

  // Generate report title
  private generateReportTitle(filters: ReportFilters, includeTimestamp: boolean = false): string {
    let title = '';
    
    if (filters.type === 'daily') {
      if (filters.startDate && filters.endDate) {
        title = `Daily Leave & OD Report for Batch ${filters.batch}-${parseInt(filters.batch || '0') + 4} (${format(new Date(filters.startDate), 'MMM d, yyyy')} - ${format(new Date(filters.endDate), 'MMM d, yyyy')})`;
      } else {
        title = `Daily Leave & OD Report for Batch ${filters.batch}-${parseInt(filters.batch || '0') + 4}, Semester ${filters.semester}`;
      }
    } else {
      if (filters.batch && filters.batch !== 'all') {
        title = `Student Summary Report for Batch ${filters.batch}-${parseInt(filters.batch) + 4}`;
      } else {
        title = 'All Students Summary Report';
      }
    }

    if (includeTimestamp) {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      title += `_${timestamp}`;
    }

    return title;
  }

  // Enhanced download with server-side integration and fallback
  async downloadReport(filters: ReportFilters, format: 'xlsx' | 'csv' | 'pdf', fallbackData?: ReportData[]) {
    let reportData: ReportData[] = [];
    let useServerData = true;

    try {
      // Try to get data from server first
      const serverResponse = await this.apiClient.getReportData(filters);
      reportData = serverResponse.data;
    } catch (error) {
      console.warn('Server-side report generation failed, using fallback data:', error);
      useServerData = false;
      reportData = fallbackData || this.generateDefaultData(filters);
    }

    // If no data available, generate default structure
    if (reportData.length === 0) {
      reportData = this.generateDefaultData(filters);
    }

    const reportTitle = this.generateReportTitle(filters, true);

    switch (format) {
      case 'xlsx':
        await this.generateExcel(reportData, reportTitle, filters, useServerData);
        break;
      case 'csv':
        if (useServerData) {
          try {
            // Try server-side CSV generation first
            const csvBlob = await this.apiClient.downloadReportAsCsv(filters);
            this.downloadBlob(csvBlob, `${reportTitle}.csv`);
            return;
          } catch (error) {
            console.warn('Server-side CSV generation failed, using client-side:', error);
          }
        }
        this.generateCsv(reportData, reportTitle);
        break;
      case 'pdf':
        this.generatePdf(reportData, reportTitle, filters, useServerData);
        break;
    }
  }

  private async generateExcel(data: ReportData[], title: string, filters: ReportFilters, fromServer: boolean) {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      
      // Add metadata sheet
      const metadata = [
        ['Report Title', title],
        ['Generated At', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
        ['Data Source', fromServer ? 'Server' : 'Client'],
        ['Total Records', data.length],
        ['Batch', filters.batch || 'All'],
        ['Semester', filters.semester || 'All'],
        ['Start Date', filters.startDate || 'N/A'],
        ['End Date', filters.endDate || 'N/A'],
        ['Report Type', filters.type || 'summary']
      ];
      
      const metaWs = XLSX.utils.aoa_to_sheet(metadata);
      
      XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
      XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');
      
      XLSX.writeFile(wb, `${title}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw new Error('Failed to generate Excel report');
    }
  }

  private generateCsv(data: ReportData[], title: string) {
    try {
      const csv = Papa.unparse(data);
      const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(csvBlob, `${title}.csv`);
    } catch (error) {
      console.error('Error generating CSV report:', error);
      throw new Error('Failed to generate CSV report');
    }
  }

  private generatePdf(data: ReportData[], title: string, filters: ReportFilters, fromServer: boolean) {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(title, 20, 20);
      
      // Add metadata
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy at HH:mm')}`, 20, 30);
      doc.text(`Data Source: ${fromServer ? 'Server' : 'Client'}`, 20, 37);
      doc.text(`Total Records: ${data.length}`, 20, 44);

      // Determine table structure based on data type
      let headers: string[] = [];
      let tableData: string[][] = [];

      if (filters.type === 'daily') {
        headers = ['Date', 'Students on Leave', 'Students on OD', 'Total Absent'];
        tableData = data.map(item => [
          item.date?.toString() || 'N/A',
          item.studentsOnLeave?.toString() || '0',
          item.studentsOnOD?.toString() || '0',
          item.totalAbsent?.toString() || '0'
        ]);
      } else {
        // Summary report
        const firstItem = data[0] || {};
        headers = Object.keys(firstItem);
        tableData = data.map(item => 
          headers.map(header => item[header]?.toString() || 'N/A')
        );
      }

      // Add table
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 55,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        margin: { top: 55 }
      });

      doc.save(`${title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Quick download methods for convenience
  async downloadDailyReport(batch: string, semester: string, startDate?: string, endDate?: string, format: 'xlsx' | 'csv' | 'pdf' = 'xlsx') {
    const filters: ReportFilters = {
      batch,
      semester,
      type: 'daily',
      ...(startDate && endDate ? { startDate, endDate } : {})
    };
    
    return this.downloadReport(filters, format);
  }

  async downloadSummaryReport(batch: string = 'all', format: 'xlsx' | 'csv' | 'pdf' = 'xlsx') {
    const filters: ReportFilters = {
      batch,
      type: 'summary'
    };
    
    return this.downloadReport(filters, format);
  }

  async getReportPreview(filters: ReportFilters): Promise<{ data: ReportData[], metadata: any }> {
    try {
      const response = await this.apiClient.getReportData(filters);
      return {
        data: response.data,
        metadata: response.metadata
      };
    } catch (error) {
      console.warn('Server preview failed, generating local preview:', error);
      return {
        data: this.generateDefaultData(filters),
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: 'local',
          filters,
          totalRecords: 0
        }
      };
    }
  }
}

// Export utility functions for backward compatibility
export const reportUtils = {
  generateDefaultData: (filters: ReportFilters) => new EnhancedReportGenerator().generateDefaultData(filters),
  downloadReport: async (filters: ReportFilters, format: 'xlsx' | 'csv' | 'pdf', fallbackData?: ReportData[]) => {
    const generator = new EnhancedReportGenerator();
    return generator.downloadReport(filters, format, fallbackData);
  },
  createApiClient: (token?: string) => new ReportApiClient('/api', token),
  createGenerator: (token?: string) => new EnhancedReportGenerator(token)
};

export default reportUtils;
