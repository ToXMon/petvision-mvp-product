// ============================================================================
// Component: PDFDownloadButton
// Web button component for downloading PDF reports
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle } from 'lucide-react';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface PDFDownloadButtonProps {
  scanResultId: string;
  reportType?: 'summary' | 'detailed';
  includeQRCode?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  onSuccess?: (reportId: string) => void;
  onError?: (error: string) => void;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PDFDownloadButton({
  scanResultId,
  reportType = 'detailed',
  includeQRCode = true,
  className = '',
  variant = 'default',
  size = 'default',
  onSuccess,
  onError,
}: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scan_result_id: scanResultId,
          report_type: reportType,
          include_qr_code: includeQRCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get report ID from headers
      const reportId = response.headers.get('X-Report-ID');

      // Get PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = reportId
        ? `PetVision-Report-${reportId}.pdf`
        : `PetVision-Report-${scanResultId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (onSuccess && reportId) {
        onSuccess(reportId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleDownload}
        disabled={isLoading}
        variant={variant}
        size={size}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download {reportType === 'summary' ? 'Summary' : 'Full'} Report
          </>
        )}
      </Button>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Quick Download Variants
// ----------------------------------------------------------------------------

export function QuickDownloadButton({
  scanResultId,
  className,
}: {
  scanResultId: string;
  className?: string;
}) {
  return (
    <PDFDownloadButton
      scanResultId={scanResultId}
      reportType="summary"
      className={className}
      size="sm"
    />
  );
}

export function FullReportDownloadButton({
  scanResultId,
  className,
}: {
  scanResultId: string;
  className?: string;
}) {
  return (
    <PDFDownloadButton
      scanResultId={scanResultId}
      reportType="detailed"
      className={className}
      variant="outline"
    >
      <FileText className="h-4 w-4" />
      Download Full Report
    </PDFDownloadButton>
  );
}
