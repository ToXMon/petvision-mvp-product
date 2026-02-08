// ============================================================================
// Tests: API Routes Integration
// Integration tests for PDF report API routes
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as generatePDF } from '@/app/api/reports/generate-pdf/route';
import { POST as streamPDF } from '@/app/api/reports/stream-pdf/route';
import { POST as shareEmail } from '@/app/api/reports/share-email/route';
import { NextRequest } from 'next/server';

// Mock services
vi.mock('@/services/PDFService');
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(),
}));

import { PDFService } from '@/services/PDFService';
import nodemailer from 'nodemailer';

describe('PDF Report API Routes - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup PDF service mock
    (PDFService.prototype.generatePDFFromScanId as any).mockResolvedValue({
      success: true,
      pdfBuffer: Buffer.from('mock pdf content'),
      reportId: 'test-report-123',
      sizeBytes: 1024,
    });

    // Setup email transporter mock
    const mockSendMail = vi.fn().mockResolvedValue({
      messageId: 'test-message-id',
    });

    (nodemailer.createTransport as any).mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/reports/generate-pdf', () => {
    it('should generate and return PDF as download', async () => {
      const requestBody = JSON.stringify({
        scan_result_id: 'scan-123',
        report_type: 'detailed',
        include_qr_code: true,
      });

      const request = new NextRequest('http://localhost/api/reports/generate-pdf', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await generatePDF(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('X-Report-ID')).toBe('test-report-123');
    });

    it('should validate scan_result_id parameter', async () => {
      const requestBody = JSON.stringify({});

      const request = new NextRequest('http://localhost/api/reports/generate-pdf', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await generatePDF(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('scan_result_id is required');
    });

    it('should handle PDF generation errors', async () => {
      (PDFService.prototype.generatePDFFromScanId as any).mockResolvedValue({
        success: false,
        error: 'Scan not found',
        pdfBuffer: null,
      });

      const requestBody = JSON.stringify({ scan_result_id: 'invalid-scan' });

      const request = new NextRequest('http://localhost/api/reports/generate-pdf', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await generatePDF(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Scan not found');
    });

    it('should support summary report type', async () => {
      const requestBody = JSON.stringify({
        scan_result_id: 'scan-123',
        report_type: 'summary',
      });

      const request = new NextRequest('http://localhost/api/reports/generate-pdf', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await generatePDF(request);

      expect(response.status).toBe(200);
      expect(PDFService.prototype.generatePDFFromScanId).toHaveBeenCalledWith(
        'scan-123',
        expect.objectContaining({ reportType: 'summary' })
      );
    });
  });

  describe('POST /api/reports/stream-pdf', () => {
    it('should stream PDF inline for browser display', async () => {
      const requestBody = JSON.stringify({
        scan_result_id: 'scan-123',
      });

      const request = new NextRequest('http://localhost/api/reports/stream-pdf', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await streamPDF(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('inline');
      expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
    });

    it('should validate scan_result_id parameter', async () => {
      const requestBody = JSON.stringify({});

      const request = new NextRequest('http://localhost/api/reports/stream-pdf', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await streamPDF(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/reports/share-email', () => {
    it('should send PDF via email', async () => {
      const requestBody = JSON.stringify({
        scan_result_id: 'scan-123',
        email: 'vet@example.com',
        recipient_name: 'Dr. Smith',
      });

      const request = new NextRequest('http://localhost/api/reports/share-email', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await shareEmail(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.reportId).toBe('test-report-123');
      expect(data.email).toBe('vet@example.com');
    });

    it('should validate email format', async () => {
      const requestBody = JSON.stringify({
        scan_result_id: 'scan-123',
        email: 'invalid-email',
      });

      const request = new NextRequest('http://localhost/api/reports/share-email', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await shareEmail(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Valid email address is required');
    });

    it('should validate scan_result_id parameter', async () => {
      const requestBody = JSON.stringify({
        email: 'vet@example.com',
      });

      const request = new NextRequest('http://localhost/api/reports/share-email', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await shareEmail(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('scan_result_id is required');
    });

    it('should handle email sending errors', async () => {
      const mockSendMail = vi.fn().mockRejectedValue(new Error('SMTP error'));
      (nodemailer.createTransport as any).mockReturnValue({
        sendMail: mockSendMail,
      });

      const requestBody = JSON.stringify({
        scan_result_id: 'scan-123',
        email: 'vet@example.com',
      });

      const request = new NextRequest('http://localhost/api/reports/share-email', {
        method: 'POST',
        body: requestBody,
        headers: { 'content-type': 'application/json' },
      });

      const response = await shareEmail(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/reports/generate-pdf (for testing)', () => {
    it('should support GET requests with query params', async () => {
      const request = new NextRequest(
        'http://localhost/api/reports/generate-pdf?scan_result_id=scan-123&report_type=summary',
        { method: 'GET' }
      );

      const response = await generatePDF(request);

      expect(response.status).toBe(200);
      expect(PDFService.prototype.generatePDFFromScanId).toHaveBeenCalledWith(
        'scan-123',
        expect.objectContaining({ reportType: 'summary' })
      );
    });
  });
});
