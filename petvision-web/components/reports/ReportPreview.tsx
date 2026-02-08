// ============================================================================
// Component: ReportPreview
// Preview PDF report in browser before download
// ============================================================================

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/button';
import {
  FileText,
  Eye,
  Download,
  Printer,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
} from 'lucide-react';
import { PDFDownloadButton } from './PDFDownloadButton';
import { PDFShareButton } from './PDFShareButton';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface ReportPreviewProps {
  scanResultId: string;
  trigger?: React.ReactNode;
  reportType?: 'summary' | 'detailed';
  className?: string;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ReportPreview({
  scanResultId,
  trigger,
  reportType = 'detailed',
  className = '',
}: ReportPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const loadPDF = async () => {
    setIsLoading(true);
    setError(null);
    setPdfUrl(null);

    try {
      const response = await fetch('/api/reports/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scan_result_id: scanResultId,
          report_type: reportType,
          include_qr_code: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !pdfUrl) {
      loadPDF();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleClose = () => {
    setIsOpen(false);
    setScale(1);
    setRotation(0);
  };

  const defaultTrigger = (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700 ${className}`}
    >
      <Eye className="h-4 w-4" />
      Preview Report
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Health Report Preview
              </DialogTitle>
              <DialogDescription className="mt-2">
                {reportType === 'summary' ? 'Summary Report' : 'Detailed Report'} •
                Scan ID: {scanResultId}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-md mr-2">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-100 rounded-l-md transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-100 rounded-r-md transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              {/* Rotate Button */}
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors border"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
          {isLoading && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600">Generating PDF preview...</p>
            </div>
          )}

          {error && (
            <div className="text-center p-8 bg-red-50 rounded-lg">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Failed to generate preview</p>
              <p className="text-red-500 text-sm mt-2">{error}</p>
              <button
                type="button"
                onClick={loadPDF}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {pdfUrl && (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="w-full h-full border shadow-lg"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              title="PDF Preview"
            />
          )}
        </div>

        {/* Action Bar */}
        <div className="p-6 border-t flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <PDFDownloadButton
              scanResultId={scanResultId}
              reportType={reportType}
              size="default"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </PDFDownloadButton>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!pdfUrl || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <PDFShareButton
              scanResultId={scanResultId}
              reportType={reportType}
              size="default"
              variant="outline"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </PDFShareButton>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------
// Compact Preview Variant (for Cards)
// ----------------------------------------------------------------------------

interface CompactPreviewButtonProps {
  scanResultId: string;
  reportType?: 'summary' | 'detailed';
}

export function CompactPreviewButton({
  scanResultId,
  reportType = 'summary',
}: CompactPreviewButtonProps) {
  return (
    <ReportPreview
      scanResultId={scanResultId}
      reportType={reportType}
      trigger={
        <button
          type="button"
          className="p-2 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
          title="Preview Report"
        >
          <Eye className="h-4 w-4" />
        </button>
      }
    />
  );
}
