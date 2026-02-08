# PDF Generation Integration Guide

## Overview
This guide explains how to integrate the PetVision PDF generation system into your application.

## Table of Contents
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Server-Side Integration](#server-side-integration)
- [Client-Side Integration](#client-side-integration)
- [Mobile Integration](#mobile-integration)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies

```bash
# Core dependencies
npm install puppeteer qrcode handlebars

# Type definitions
npm install @types/puppeteer @types/qrcode
```

### 2. Basic Usage

```typescript
import { PDFService } from '@petvision/shared';

const pdfService = new PDFService();

// Generate a summary report
const result = await pdfService.generateSummary(reportData);
if (result.success) {
  console.log('PDF generated:', result.buffer);
}
```

---

## Installation

### Server-Side (Node.js)

```bash
npm install @petvision/shared
```

### Web Client (Next.js)

```bash
npm install @petvision/shared
```

### Mobile (React Native)

```bash
npm install @petvision/shared
npx expo install expo-file-system expo-sharing expo-media-library
```

---

## Server-Side Integration

### Setting Up the PDFService

```typescript
// services/pdfService.ts
import { PDFService } from '@petvision/shared';
import { QRCodeService } from '@petvision/shared';
import { ReportService } from '@petvision/shared';

const qrCodeService = new QRCodeService({
  baseUrl: process.env.APP_URL || 'https://app.petvision.ai'
});

const reportService = new ReportService({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
});

export const pdfService = new PDFService({
  qrCodeService,
  reportService,
  templateDir: './templates'
});
```

### API Route Example (Next.js App Router)

```typescript
// app/api/reports/generate-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pdfService } from '@/services/pdfService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scan_result_id, report_type = 'detailed' } = body;

    // Fetch report data
    const reportData = await reportService.fetchReportData(scan_result_id);

    // Generate PDF
    const result = await pdfService.generatePDF(reportData, {
      reportType: report_type,
      format: 'A4',
      includeTrends: report_type === 'detailed',
      includeQRCode: true,
      includeImages: true
    });

    if (!result.success || !result.buffer) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate PDF' },
        { status: 500 }
      );
    }

    // Return PDF as downloadable file
    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PetVision-Report-${reportData.reportId}.pdf"`,
        'X-Report-ID': reportData.reportId
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Background Job Integration

```typescript
// jobs/generatePdfReports.ts
import { pdfService } from '@/services/pdfService';

export async function generateScheduledReport(scanId: string) {
  try {
    const reportData = await reportService.fetchReportData(scanId);
    const result = await pdfService.generateDetailed(reportData);

    if (result.success && result.buffer) {
      // Save to Supabase Storage
      const { data, error } = await supabase.storage
        .from('health-reports')
        .upload(`reports/${reportData.reportId}.pdf`, result.buffer, {
          contentType: 'application/pdf'
        });

      if (error) throw error;
      return data.path;
    }
  } catch (error) {
    console.error('Scheduled report generation failed:', error);
  }
}
```

---

## Client-Side Integration

### Using PDFDownloadButton Component

```tsx
// app/dashboard/[scanId]/page.tsx
import { PDFDownloadButton } from '@/components/reports/PDFDownloadButton';

export default function ScanDetailPage({ params }: { params: { scanId: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scan Report</h1>
      
      {/* Download Full Report */}
      <PDFDownloadButton
        scanResultId={params.scanId}
        reportType="detailed"
        onSuccess={(reportId) => {
          console.log('Report downloaded:', reportId);
        }}
        onError={(error) => {
          console.error('Download failed:', error);
        }}
      />

      {/* Download Summary */}
      <div className="mt-4">
        <PDFDownloadButton
          scanResultId={params.scanId}
          reportType="summary"
          variant="outline"
          size="sm"
        />
      </div>
    </div>
  );
}
```

### Using ReportPreview Component

```tsx
// app/dashboard/[scanId]/page.tsx
import { ReportPreview } from '@/components/reports/ReportPreview';

export default function ScanDetailPage({ params }: { params: { scanId: string } }) {
  return (
    <div className="p-6">
      <ReportPreview
        scanResultId={params.scanId}
        reportType="detailed"
        trigger={
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md">
            Preview Report
          </button>
        }
      />
    </div>
  );
}
```

### Using PDFShareButton Component

```tsx
// app/dashboard/[scanId]/page.tsx
import { PDFShareButton } from '@/components/reports/PDFShareButton';

export default function ScanDetailPage({ params }: { params: { scanId: string } }) {
  return (
    <div className="p-6">
      <PDFShareButton
        scanResultId={params.scanId}
        reportType="detailed"
        onSuccess={(method, reportId) => {
          console.log(`Shared via ${method}:`, reportId);
        }}
      />
    </div>
  );
}
```

---

## Mobile Integration

### Android Permissions Setup

Add to `app.json`:

```json
{
  "expo": {
    "android": {
      "permissions": [
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### Using PDFDownloadButton (React Native)

```tsx
// components/ReportActions.tsx
import { PDFDownloadButton } from './reports/PDFDownloadButton';

export function ReportActions({ scanId }: { scanId: string }) {
  return (
    <View className="p-4 space-y-4">
      {/* Download Summary */}
      <PDFDownloadButton
        scanResultId={scanId}
        reportType="summary"
        onDownloadComplete={(filePath, reportId) => {
          console.log('Saved to:', filePath);
        }}
      />

      {/* Download Full Report */}
      <PDFDownloadButton
        scanResultId={scanId}
        reportType="detailed"
        showFileName={true}
      />
    </View>
  );
}
```

### Using PDFShareButton (React Native)

```tsx
import { PDFShareButton } from './reports/PDFShareButton';

export function ShareReport({ scanId }: { scanId: string }) {
  return (
    <PDFShareButton
      scanResultId={scanId}
      reportType="detailed"
      onShareComplete={(method) => {
        console.log('Shared via:', method);
      }}
    />
  );
}
```

---

## Customization

### Custom Templates

Create custom Handlebars templates in your templates directory:

```html
<!-- templates/custom-section.html -->
<div class="custom-section">
  <h2>{{petName}}'s Health Summary</h2>
  <p>Scan Date: {{scanDate}}</p>
  
  {{#each findings}}
  <div class="finding {{severityClass}}">
    <h3>{{condition}}</h3>
    <p>{{description}}</p>
    <span class="confidence">Confidence: {{confidencePercent}}%</span>
  </div>
  {{/each}}
</div>
```

### Custom PDF Options

```typescript
const customOptions = {
  reportType: PDFReportType.DETAILED,
  format: PDFFormat.LETTER,
  includeTrends: true,
  includeComparison: true,
  includeQRCode: true,
  includeImages: true,
  customSections: ['custom-section'],
  pageSize: {
    width: '8.5in',
    height: '11in'
  },
  margins: {
    top: '0.5in',
    bottom: '0.5in',
    left: '0.5in',
    right: '0.5in'
  }
};

await pdfService.generatePDF(reportData, customOptions);
```

### Custom QR Code Styling

```typescript
const qrCodeService = new QRCodeService({
  baseUrl: 'https://app.petvision.ai'
});

const qrOptions = {
  size: 300,
  margin: 4,
  color: {
    dark: '#1E40AF',  // Custom blue color
    light: '#FFFFFF'
  },
  errorCorrectionLevel: 'H'
};

const qrCode = await qrCodeService.generateQRCode(qrData, qrOptions);
```

---

## Troubleshooting

### Common Issues

#### 1. Puppeteer Browser Launch Failures

**Issue:** `Failed to launch browser`

**Solution:**
```typescript
const pdfService = new PDFService({
  launchOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  }
});
```

#### 2. Template Not Found

**Issue:** `Template not found: cover.html`

**Solution:**
```typescript
const pdfService = new PDFService({
  templateDir: '/absolute/path/to/templates'
});
```

#### 3. PDF Generation Timeout

**Issue:** PDF generation takes too long

**Solution:**
```typescript
const result = await pdfService.generatePDF(reportData, {
  reportType: PDFReportType.SUMMARY,  // Use summary for faster generation
  timeout: 60000  // Increase timeout to 60 seconds
});
```

#### 4. Memory Issues

**Issue:** Out of memory when generating multiple PDFs

**Solution:**
```typescript
// Clear caches periodically
pdfService.clearTemplateCache();
pdfService.clearPDFCache();

// Or destroy and recreate service
await pdfService.destroy();
const newService = new PDFService();
```

#### 5. Mobile Download Failures

**Issue:** Permission denied on Android

**Solution:**
```tsx
// Request storage permission before download
const requestPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};
```

---

## Performance Best Practices

1. **Use Summary Reports** for previews and quick sharing
2. **Cache Generated PDFs** for repeated access
3. **Batch Generate** reports during off-peak hours
4. **Reuse Browser Instances** to avoid launch overhead
5. **Limit Concurrent Generations** to 3-4 to avoid memory issues

---

## Testing Your Integration

### Test Script

```typescript
// test-pdf-generation.ts
import { PDFService, ReportService, QRCodeService } from '@petvision/shared';

async function testPDFGeneration() {
  const qrCodeService = new QRCodeService();
  const reportService = new ReportService();
  const pdfService = new PDFService({ qrCodeService, reportService });

  try {
    // Test with a real scan ID
    const scanId = 'your-test-scan-id';
    const reportData = await reportService.fetchReportData(scanId);
    
    console.log('Testing summary report...');
    const summary = await pdfService.generateSummary(reportData);
    console.log('Summary:', summary.success ? '✓' : '✗');
    
    console.log('Testing detailed report...');
    const detailed = await pdfService.generateDetailed(reportData);
    console.log('Detailed:', detailed.success ? '✓' : '✗');
    
    await pdfService.destroy();
    console.log('Tests complete!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPDFGeneration();
```

---

## Additional Resources

- [API Documentation](./PDF_GENERATION_API.md)
- [Template Reference](./TEMPLATE_REFERENCE.md)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

---

## Support

For issues or questions, contact the PetVision development team.

## License

PetVision Internal Documentation - Confidential
