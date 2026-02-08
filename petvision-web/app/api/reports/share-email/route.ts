// ============================================================================
// API Route: Share PDF via Email
// POST /api/reports/share-email
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/services/PDFService';
import { PDFReportConfig } from '@petvision/shared';

// Initialize PDF service
const pdfService = new PDFService();

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@petvision.ai';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // This is a mock implementation. In production, use nodemailer or similar
  // Example with nodemailer:
  /*
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
  */
  
  console.log('Email would be sent:', {
    to: options.to,
    subject: options.subject,
    hasAttachment: !!options.attachments,
  });
  
  return { success: true };
}

// ----------------------------------------------------------------------------
// POST Handler
// ----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      scan_result_id,
      email,
      recipient_name,
      report_type = 'detailed',
      include_qr_code = true,
    } = body;

    // Validate required parameters
    if (!scan_result_id) {
      return NextResponse.json(
        { success: false, error: 'scan_result_id is required' },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Configure PDF options
    const config: PDFReportConfig = {
      reportType: report_type as any,
      includeQRCode: include_qr_code,
      includeTrends: report_type === 'detailed',
      includeComparison: report_type === 'detailed',
      format: 'A4',
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in',
      },
    };

    // Generate PDF
    const pdfResult = await pdfService.generatePDFFromScanId(scan_result_id, config);

    if (!pdfResult.success || !pdfResult.pdfBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: pdfResult.error || 'Failed to generate PDF',
          reportId: pdfResult.reportId,
        },
        { status: 500 }
      );
    }

    // Create email content
    const recipientGreeting = recipient_name ? `Hello ${recipient_name}` : 'Hello';
    const reportId = pdfResult.reportId;
    const filename = `PetVision-Report-${reportId}.pdf`;
    
    const emailSubject = `PetVision Health Report - ${reportId}`;
    
    const emailText = `
${recipientGreeting},

Please find attached the PetVision Health Report for your pet's recent scan.

Report ID: ${reportId}
Generated: ${new Date().toISOString()}

This AI-powered report includes:
- Scan findings and analysis
- Severity assessments
- Veterinary recommendations
- Trend analysis (if applicable)

IMPORTANT: This AI analysis is not a substitute for professional veterinary care.
Please share this report with your veterinarian for proper diagnosis and treatment.

If you have any questions or concerns, please contact our support team.

Best regards,
The PetVision Team

---
PetVision AI Health Screening System
https://petvision.ai
`;

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .disclaimer { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">PetVision Health Report</h1>
  </div>
  
  <div class="content">
    <p>${recipientGreeting},</p>
    <p>Please find attached the PetVision Health Report for your pet's recent scan.</p>
    
    <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <strong>Report Details:</strong><br>
      Report ID: ${reportId}<br>
      Generated: ${new Date().toLocaleDateString()}
    </div>
    
    <p>This AI-powered report includes:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li>Scan findings and analysis</li>
      <li>Severity assessments</li>
      <li>Veterinary recommendations</li>
      <li>Trend analysis (if applicable)</li>
    </ul>
    
    <div class="disclaimer">
      <strong>⚠️ IMPORTANT:</strong> This AI analysis is not a substitute for professional veterinary care. Please share this report with your veterinarian for proper diagnosis and treatment.
    </div>
    
    <p>If you have any questions or concerns, please contact our support team.</p>
    
    <p>Best regards,<br>The PetVision Team</p>
  </div>
  
  <div class="footer">
    <p>PetVision AI Health Screening System</p>
    <p><a href="https://petvision.ai">petvision.ai</a></p>
  </div>
</body>
</html>
`;

    // Send email with PDF attachment
    const emailResult = await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHTML,
      attachments: [
        {
          filename: filename,
          content: pdfResult.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PDF report sent successfully',
      reportId: pdfResult.reportId,
      email: email,
    });
  } catch (error) {
    console.error('Error in share-email route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
