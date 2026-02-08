// ============================================================================
// Component: PDFShareButton
// Component for sharing PDF reports via email or other methods
// ============================================================================

'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui/button';
import { Share2, Mail, Link2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface PDFShareButtonProps {
  scanResultId: string;
  reportType?: 'summary' | 'detailed';
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  onSuccess?: (method: string, reportId: string) => void;
  onError?: (error: string) => void;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PDFShareButton({
  scanResultId,
  reportType = 'detailed',
  className = '',
  variant = 'default',
  size = 'default',
  onSuccess,
  onError,
}: PDFShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareMethod, setShareMethod] = useState<'email' | 'link' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [reportLink, setReportLink] = useState<string | null>(null);

  const handleOpenDialog = () => {
    setIsOpen(true);
    setShareMethod(null);
    setError(null);
    setSuccess(false);
  };

  const handleSendEmail = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/share-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scan_result_id: scanResultId,
          email,
          recipient_name: recipientName || undefined,
          report_type: reportType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess('email', data.reportId);
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

  const handleCopyLink = async () => {
    // Generate a shareable link to the report
    const link = `${window.location.origin}/reports/${scanResultId}`;
    setReportLink(link);
    setShareMethod('link');

    try {
      await navigator.clipboard.writeText(link);
      setSuccess(true);
      if (onSuccess) {
        onSuccess('link', scanResultId);
      }
    } catch (err) {
      setError('Failed to copy link to clipboard');
    }
  };

  const handleReset = () => {
    setShareMethod(null);
    setError(null);
    setSuccess(false);
    setEmail('');
    setRecipientName('');
    setReportLink(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        variant={variant}
        size={size}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share Report
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share PetVision Report</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share this health report.
            </DialogDescription>
          </DialogHeader>

          {!shareMethod && (
            <div className="grid gap-4 py-4">
              <Button
                onClick={() => setShareMethod('email')}
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Send via Email</div>
                    <div className="text-sm text-muted-foreground">
                      Email PDF report to recipient
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="h-auto flex-col items-start gap-2 p-4"
              >
                <div className="flex items-center gap-3">
                  <Link2 className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Copy Share Link</div>
                    <div className="text-sm text-muted-foreground">
                      Copy link to view report online
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          )}

          {shareMethod === 'email' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Recipient Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vet@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || success}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Recipient Name (Optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Dr. Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={isLoading || success}
                />
              </div>

              {success && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Report sent successfully!</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {shareMethod === 'link' && reportLink && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={reportLink} readOnly />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(reportLink);
                      setSuccess(true);
                    }}
                    size="icon"
                    variant="outline"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {success && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Link copied to clipboard!</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {shareMethod ? (
              <>
                {!success && (
                  <Button variant="outline" onClick={handleReset}>
                    Back
                  </Button>
                )}
                {shareMethod === 'email' && !success && (
                  <Button onClick={handleSendEmail} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Report'
                    )}
                  </Button>
                )}
                {success && (
                  <Button onClick={handleClose}>Done</Button>
                )}
              </>
            ) : (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ----------------------------------------------------------------------------
// Quick Share Button Variants
// ----------------------------------------------------------------------------

export function EmailShareButton({
  scanResultId,
  className,
}: {
  scanResultId: string;
  className?: string;
}) {
  return (
    <PDFShareButton
      scanResultId={scanResultId}
      className={className}
      size="sm"
      variant="outline"
    />
  );
}
