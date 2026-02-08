// ============================================================================
// API Route: Stream PDF
// POST /api/reports/stream-pdf
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/services/PDFService';
import { PDFReportConfig } from '@petvision/shared';

// Initialize PDF service
const pdfService = new PDFService();

// ----------------------------------------------------------------------------
// POST Handler
// ----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { scan_result_id, report_type = 'detailed', include_qr_code = true } = body;

    // Validate required parameters
    if (!scan_result_id) {
      return NextResponse.json(
        { success: false, error: 'scan_result_id is required' },
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
    const result = await pdfService.generatePDFFromScanId(scan_result_id, config);

    if (!result.success || !result.pdfBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to generate PDF',
          reportId: result.reportId,
        },
        { status: 500 }
      );
    }

    // Return PDF as inline display (browser will show it)
    return new NextResponse(result.pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="report.pdf"',
        'Content-Length': String(result.sizeBytes),
        'X-Report-ID': result.reportId,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error in stream-pdf route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// GET Handler (for testing)
// ----------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const scan_result_id = searchParams.get('scan_result_id');
  const report_type = searchParams.get('report_type') || 'detailed';
  const include_qr_code = searchParams.get('include_qr_code') === 'true';

  if (!scan_result_id) {
    return NextResponse.json(
      { success: false, error: 'scan_result_id query parameter is required' },
      { status: 400 }
    );
  }

  // Create request for POST handler
  const postRequest = new NextRequest('http://localhost/api/reports/stream-pdf', {
    method: 'POST',
    body: JSON.stringify({ scan_result_id, report_type, include_qr_code }),
    headers: { 'content-type': 'application/json' },
  });

  return POST(postRequest);
}
