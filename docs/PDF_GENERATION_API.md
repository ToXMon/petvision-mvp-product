# PDF Generation API Documentation

## Overview
The PetVision PDF generation system provides comprehensive report generation capabilities for pet health screenings. It supports both summary (1-page) and detailed (multi-page) report formats with customizable options.

## Table of Contents
- [Services](#services)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Components](#components)
- [Error Handling](#error-handling)

---

## Services

### PDFService

The core service responsible for generating PDF reports using Puppeteer and Handlebars templates.

#### Constructor

```typescript
new PDFService(config?: PDFServiceConfig)
```

**Parameters:**
- `config` (optional): Configuration object
  - `qrCodeService`: QRCodeService instance
  - `reportService`: ReportService instance
  - `templateDir`: Path to template directory
  - `browserInstance`: Puppeteer Browser instance (for reuse)

#### Methods

##### `generatePDF(data, options)`

Generate a PDF with full control over options.

```typescript
interface PDFReportConfig {
  reportType: PDFReportType;
  format: PDFFormat;
  includeTrends?: boolean;
  includeComparison?: boolean;
  includeQRCode?: boolean;
  includeImages?: boolean;
  customSections?: string[];
}

enum PDFReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
}

enum PDFFormat {
  A4 = 'A4',
  LETTER = 'Letter',
}

interface GeneratePDFResult {
  success: boolean;
  reportId?: string;
  buffer?: Buffer;
  error?: string;
  pages?: number;
}
```

##### `generateSummary(data)`

Generate a 1-page summary report.

```typescript
generateSummary(data: PDFReportData): Promise<GeneratePDFResult>
```

##### `generateDetailed(data)`

Generate a multi-page detailed report.

```typescript
generateDetailed(data: PDFReportData): Promise<GeneratePDFResult>
```

##### `generatePDFFromScanId(scanId, config)`

Generate PDF directly from a scan result ID (fetches data automatically).

```typescript
generatePDFFromScanId(
  scanId: string,
  config: PDFReportConfig
): Promise<GeneratePDFResult>
```

##### Cache Management

```typescript
// Clear template cache
clearTemplateCache(): void

// Clear PDF cache
clearPDFCache(): void

// Clear all caches
clearAllCaches(): void

// Get cache statistics
getCacheStats(): {
  templateCache: number;
  pdfCache: number;
  pdfCacheSize: string;
}
```

##### Cleanup

```typescript
// Close browser and clean up resources
destroy(): Promise<void>
```

---

### ReportService

Handles data fetching from Supabase and formatting for PDF generation.

#### Constructor

```typescript
new ReportService(config?: ReportServiceConfig)
```

**Parameters:**
- `config` (optional):
  - `supabaseUrl`: Supabase project URL
  - `supabaseKey`: Supabase anon/public key
  - `tableName`: Custom table names

#### Methods

##### `fetchReportData(scanId)`

Fetch complete report data for a scan.

```typescript
fetchReportData(scanId: string): Promise<PDFReportData>
```

**Returns:**
```typescript
interface PDFReportData {
  reportId: string;
  generatedAt: string;
  pet: PetProfile;
  scan: ScanResult;
  recommendations: VetRecommendation[];
  trend?: TrendData;
}
```

##### `generateRecommendations(scanResult)`

Generate AI-based recommendations from scan findings.

```typescript
generateRecommendations(
  scanResult: ScanResult
): VetRecommendation[]
```

##### Static Utility Methods

```typescript
// Calculate pet age from DOB
calculatePetAge(dateOfBirth: string | undefined): string

// Format date string
formatDate(dateString: string): string

// Get human-readable scan type label
getScanTypeLabel(scanType: string): string

// Get human-readable severity label
getSeverityLabel(severity: Severity): string

// Group findings by severity
groupFindingsBySeverity(
  findings: Finding[]
): Record<Severity, Finding[]>

// Get findings summary statistics
getFindingsSummary(
  findings: Finding[]
): {
  total: number;
  green: number;
  yellow: number;
  red: number;
  averageConfidence: number;
}

// Generate unique report ID
generateReportId(): string
```

---

### QRCodeService

Generates QR codes for report sharing and linking.

#### Constructor

```typescript
new QRCodeService(config?: QRCodeServiceConfig)
```

**Parameters:**
- `config` (optional):
  - `baseUrl`: Base URL for report links (default: app domain)

#### Methods

##### `generateQRCode(data, options)`

Generate a QR code as base64 data URL.

```typescript
generateQRCode(
  data: QRCodeData,
  options?: QRCodeOptions
): Promise<string>
```

**Parameters:**
```typescript
interface QRCodeData {
  reportId: string;
  url: string;
  expiresAt?: string;
  accessKey?: string;
}

interface QRCodeOptions {
  size?: number; // default: 200
  margin?: number; // default: 2
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}
```

##### `generateReportQR(reportId, customUrl)`

Generate QR code for a report.

```typescript
generateReportQR(
  reportId: string,
  customUrl?: string
): Promise<string>
```

##### `generateQRBuffer(data, options)`

Generate QR code as Buffer.

```typescript
generateQRBuffer(
  data: QRCodeData,
  options?: QRCodeOptions
): Promise<Buffer>
```

##### `getReportUrl(reportId, accessKey)`

Generate report URL.

```typescript
getReportUrl(
  reportId: string,
  accessKey?: string
): string
```

---

## API Endpoints

### POST `/api/reports/generate-pdf`

Generate and return a PDF report.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "scan_result_id": "string (required)",
  "report_type": "summary | detailed (default: detailed)",
  "include_qr_code": "boolean (default: true)",
  "include_trends": "boolean (default: true for detailed)",
  "format": "A4 | Letter (default: A4)"
}
```

**Response:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="PetVision-Report-{reportId}.pdf"
X-Report-ID: {reportId}
```

**Response Body:** PDF binary data

**Error Response:**
```json
{
  "error": "Error message describing what went wrong"
}
```

**Status Codes:**
- `200` - PDF generated successfully
- `400` - Invalid request parameters
- `404` - Scan result not found
- `500` - Internal server error

---

### POST `/api/reports/share-email`

Send a report via email.

**Request Body:**
```json
{
  "scan_result_id": "string (required)",
  "email": "string (required)",
  "recipient_name": "string (optional)",
  "report_type": "summary | detailed (default: detailed)"
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "RPT-XXX",
  "message": "Email sent successfully"
}
```

---

### GET `/api/reports/{scanId}`

Get report data (for preview, sharing).

**Response:**
```json
{
  "reportId": "string",
  "pet": { ... },
  "scan": { ... },
  "recommendations": [ ... ],
  "trend": { ... }
}
```

---

## Data Models

### PDFReportData

```typescript
interface PDFReportData {
  reportId: string;
  generatedAt: string;
  pet: PetProfile;
  scan: ScanResult;
  recommendations: VetRecommendation[];
  trend?: TrendData;
}
```

### PetProfile

```typescript
interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed?: string;
  date_of_birth?: string;
  avatar_url?: string;
  created_at: string;
}
```

### ScanResult

```typescript
interface ScanResult {
  id: string;
  pet_id: string;
  scan_type: 'eye' | 'skin' | 'teeth' | 'gait';
  severity: Severity;
  findings: Finding[];
  image_url: string;
  created_at: string;
}
```

### Finding

```typescript
interface Finding {
  id: string;
  condition: string;
  description: string;
  confidence: number;
  severity: Severity;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### Severity

```typescript
enum Severity {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}
```

### VetRecommendation

```typescript
interface VetRecommendation {
  id: string;
  scanId: string;
  category: string;
  recommendation: string;
  severity: Severity;
  priority: 'routine' | 'urgent' | 'immediate';
  actionItems?: string[];
  timeframe?: string;
}
```

### TrendData

```typescript
interface TrendData {
  overallTrend: 'improving' | 'stable' | 'declining';
  percentageChange: number;
  severityChange: 'improved' | 'none' | 'worsened';
  findingsChange: {
    added: number;
    resolved: number;
    improved: number;
    worsened: number;
  };
  message: string;
}
```

---

## Components

### Web Components (`petvision-web/components/reports/`)

#### PDFDownloadButton

React component for downloading PDF reports.

```typescript
<PDFDownloadButton
  scanResultId="string (required)"
  reportType="summary | detailed (default: detailed)"
  includeQRCode={true}
  variant="default | outline | ghost"
  size="default | sm | lg"
  onSuccess={(reportId) => {}}
  onError={(error) => {}}
/>
```

#### PDFShareButton

React component for sharing reports via email or link.

```typescript
<PDFShareButton
  scanResultId="string (required)"
  reportType="summary | detailed (default: detailed)"
  onSuccess={(method, reportId) => {}}
  onError={(error) => {}}
/>
```

#### ReportPreview

Dialog component for previewing PDFs in browser.

```typescript
<ReportPreview
  scanResultId="string (required)"
  reportType="summary | detailed (default: detailed)"
  trigger={<button>Custom Trigger</button>}
/>
```

---

### Mobile Components (`petvision-mobile/components/reports/`)

#### PDFDownloadButton (React Native)

```typescript
<PDFDownloadButton
  scanResultId="string (required)"
  reportType="summary | detailed (default: detailed)"
  onDownloadComplete={(filePath, reportId) => {}}
  onError={(error) => {}}
  disabled={false}
  showFileName={false}
/>
```

#### PDFShareButton (React Native)

```typescript
<PDFShareButton
  scanResultId="string (required)"
  reportType="summary | detailed (default: detailed)"
  onShareComplete={(method) => {}}
  onError={(error) => {}}
  disabled={false}
/>
```

---

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `SCAN_NOT_FOUND` | Scan result not found in database |
| `PET_NOT_FOUND` | Pet profile not found |
| `PDF_GENERATION_FAILED` | Failed to generate PDF |
| `TEMPLATE_NOT_FOUND` | Template file missing |
| `QR_GENERATION_FAILED` | QR code generation failed |
| `INVALID_REQUEST` | Invalid request parameters |
| `DATABASE_ERROR` | Database operation failed |
| `STORAGE_ERROR` | Supabase Storage operation failed |

---

## Performance Notes

- PDFs are cached for 1 hour by default
- Browser instances are pooled for reuse
- Templates are cached in memory
- Use `generateSummary()` for quick previews
- Use batch PDF generation for multiple reports

---

## License

PetVision Internal Documentation - Confidential
