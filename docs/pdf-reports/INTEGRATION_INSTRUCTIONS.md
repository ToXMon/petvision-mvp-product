# PetVision PDF Report System - Integration Instructions

## Overview

This guide provides step-by-step instructions for integrating the PDF Report Generation system into your PetVision application.

## Prerequisites

- PetVision web application running on Next.js 13+
- Supabase database with `scan_results` and `pet_profiles` tables
- Node.js 18+ and npm/pnpm installed
- Access to Supabase credentials
- SMTP configuration (for email sharing)

## Installation

### 1. Install Dependencies

```bash
# Install core dependencies
cd petvision-web
npm install puppeteer qrcode handlebars nodemailer

# Install type definitions
npm install --save-dev @types/qrcode @types/nodemailer
```

### 2. Install Puppeteer System Dependencies (Linux)

```bash
apt-get update
apt-get install -y \
  chromium \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libasound2
```

### 3. Configure Environment Variables

Add to `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_HEADLESS=true

# Email (for sharing)
EMAIL_FROM=noreply@petvision.ai
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# PDF Storage (Supabase Storage)
SUPABASE_STORAGE_BUCKET=health-reports

# Application
NEXT_PUBLIC_APP_URL=https://petvision.ai
```

## Database Setup

### 1. Create Storage Bucket

```sql
-- Create storage bucket for PDFs
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('health-reports', 'Health Reports', false, ARRAY['application/pdf']);

-- Create policies
create policy "Users can view their reports"
on storage.objects for select
using (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload reports"
on storage.objects for insert
with check (auth.uid()::text = (storage.foldername(name))[1]);
```
### 2. Verify Tables

Ensure these tables exist with the following structure:

```sql
-- Pet Profiles
CREATE TABLE pet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  breed TEXT,
  age_years INTEGER,
  species TEXT CHECK (species IN ('dog', 'cat', 'other')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan Results
CREATE TABLE scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pet_profiles(id),
  scan_type TEXT CHECK (scan_type IN ('eye', 'skin', 'teeth', 'gait', 'multi')),
  severity TEXT CHECK (severity IN ('green', 'yellow', 'red')),
  findings JSONB NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## File Structure

Place the files in your project:

```
petvision-web/
├── services/
│   ├── templates/
│   │   ├── cover-page-template.html
│   │   ├── findings-template.html
│   │   ├── recommendations-template.html
│   │   ├── trends-template.html
│   │   └── summary-template.html
│   ├── PDFService.ts
│   ├── ReportService.ts
│   └── QRCodeService.ts
├── components/
│   └── reports/
│       ├── PDFDownloadButton.tsx
│       ├── PDFShareButton.tsx
│       └── ReportPreview.tsx
├── app/
│   └── api/
│       └── reports/
│           ├── generate-pdf/
│           │   └── route.ts
│           ├── stream-pdf/
│           │   └── route.ts
│           └── share-email/
│               └── route.ts
└── shared/
    └── types/
        └── pdf-reports.ts
```

## Integration Steps

### Step 1: Add Components to Scan Results Page

```tsx
// app/dashboard/scan-results/[id]/page.tsx
import { PDFDownloadButton } from '@/components/reports/PDFDownloadButton';
import { PDFShareButton } from '@/components/reports/PDFShareButton';
import { ReportPreview } from '@/components/reports/ReportPreview';

export default function ScanResultPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Scan Result Details</h1>
      {/* Your existing content */}
      
      {/* PDF Actions */}
      <div className="flex gap-4 mt-8">
        <PDFDownloadButton scanResultId={params.id} />
        <PDFShareButton scanResultId={params.id} />
        <ReportPreview scanResultId={params.id} />
      </div>
    </div>
  );
}
```

### Step 2: Add to Health Report Card

```tsx
// components/health-report/HealthReportCard.tsx
import { CompactPreviewButton, QuickDownloadButton } from '@/components/reports/PDFDownloadButton';

export function HealthReportCard({ scan }: { scan: ScanResult }) {
  return (
    <div className="report-card">
      {/* Card content */}
      
      <div className="report-actions">
        <CompactPreviewButton scanResultId={scan.id} />
        <QuickDownloadButton scanResultId={scan.id} />
      </div>
    </div>
  );
}
```

### Step 3: Auto-generate Reports After Scan

```typescript
// services/ScanService.ts
import { PDFService } from './PDFService';

export class ScanService {
  private pdfService = new PDFService();
  
  async processScanResult(scanId: string) {
    // ... existing scan processing
    
    // Auto-generate detailed report
    const reportResult = await this.pdfService.generatePDFFromScanId(
      scanId,
      {
        reportType: 'detailed',
        includeQRCode: true,
        includeTrends: true,
      }
    );
    
    if (reportResult.success && reportResult.pdfBuffer) {
      // Store PDF in Supabase Storage
      await this.storeReportPDF(scanId, reportResult.pdfBuffer);
    }
    
    return reportResult;
  }
  
  private async storeReportPDF(scanId: string, pdfBuffer: Buffer) {
    const fileName = `reports/${scanId}/report-${Date.now()}.pdf`;
    
    const { error } = await supabase.storage
      .from('health-reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    
    if (error) {
      console.error('Failed to store PDF:', error);
    }
  }
}
```

### Step 4: Add Report History

```tsx
// components/reports/ReportHistory.tsx
import { CompactPreviewButton } from '@/components/reports/PDFDownloadButton';

export function ReportHistory({ petId }: { petId: string }) {
  const [scans, setScans] = useState<ScanResult[]>([]);
  
  useEffect(() => {
    fetchScans(petId).then(setScans);
  }, [petId]);
  
  return (
    <div>
      <h2>Report History</h2>
      <ul>
        {scans.map((scan) => (
          <li key={scan.id}>
            <span>{scan.scanType} - {scan.createdAt}</span>
            <CompactPreviewButton scanResultId={scan.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Step 5: Add Vet Share Workflow

```tsx
// components/reports/VetShareModal.tsx
import { PDFShareButton } from '@/components/reports/PDFShareButton';

export function VetShareModal({ scanId, isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share with Veterinarian</DialogTitle>
        </DialogHeader>
        
        <VetContactForm />
        
        <div className="mt-4">
          <PDFShareButton
            scanResultId={scanId}
            reportType="detailed"
            onSuccess={(method, reportId) => {
              toast.success(`Report ${method} sent successfully`);
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Testing the Integration

### 1. Test PDF Generation

```bash
# Create a test scan result via API
curl -X POST "http://localhost:3000/api/scans/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...scan data...}'

# Test PDF generation
curl -X POST "http://localhost:3000/api/reports/generate-pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scan_result_id": "your-scan-id"}' \
  --output test-report.pdf
```

### 2. Test Components

```tsx
// Create test page
// app/test-pdf/page.tsx
import { PDFDownloadButton, PDFShareButton, ReportPreview } from '@/components/reports';

export default function TestPDFPage() {
  return (
    <div className="p-8 space-y-8">
      <PDFDownloadButton scanResultId="test-scan-id" />
      <PDFShareButton scanResultId="test-scan-id" />
      <ReportPreview scanResultId="test-scan-id" />
    </div>
  );
}
```

### 3. Verify Integration

- [ ] PDFs generate successfully
- [ ] Download buttons work
- [ ] Preview opens correctly
- [ ] Email sharing works
- [ ] QR codes are scannable
- [ ] Storage uploads succeed
- [ ] Historical scans load
- [ ] Trend analysis displays

## Performance Optimization

### 1. Enable PDF Caching

```typescript
// services/PDFService.ts
private cache = new Map<string, { pdf: Buffer; timestamp: number }>();

async generatePDFFromScanId(scanId: string, config: PDFReportConfig) {
  const cacheKey = `${scanId}-${config.reportType}`;
  const cached = this.cache.get(cacheKey);
  
  // Return cached PDF if less than 1 hour old
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return { success: true, pdfBuffer: cached.pdf };
  }
  
  // Generate new PDF
  const result = await this.generatePDF(...);
  
  if (result.success && result.pdfBuffer) {
    this.cache.set(cacheKey, {
      pdf: result.pdfBuffer,
      timestamp: Date.now(),
    });
  }
  
  return result;
}
```

### 2. Lazy Load Components

```tsx
import dynamic from 'next/dynamic';

const PDFDownloadButton = dynamic(
  () => import('@/components/reports/PDFDownloadButton'),
  { ssr: false }
);
```

### 3. Background PDF Generation

```typescript
// Queue PDF generation for large reports
export async function POST(request: NextRequest) {
  const { scan_result_id } = await request.json();
  
  // Queue for background processing
  await queue.add('generate-pdf', { scan_result_id });
  
  return NextResponse.json({
    success: true,
    message: 'PDF queued for generation',
  });
}
```

## Security Considerations

### 1. Validate Access

```typescript
// Verify user owns the scan
const { data: scan } = await supabase
  .from('scan_results')
  .select('pet_id, pet_profiles(user_id)')
  .eq('id', scanId)
  .single();

if (scan?.pet_profiles?.user_id !== userId) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 403 }
  );
}
```

### 2. Sanitize HTML

```typescript
import DOMPurify from 'isomorphic-dompurify';

const cleanHtml = DOMPurify.sanitize(template);
```

### 3. Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

## Troubleshooting

### Puppeteer Fails to Launch

```bash
# Check Chromium installation
which chromium
chromium --version

# Set executable path
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### PDF Generation Timeout

```typescript
// Increase timeout in PDFService
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

await page.pdf({
  timeout: 30000, // 30 seconds
});
```

### Missing Template Variables

```typescript
// Validate data before rendering
const requiredFields = ['reportId', 'pet', 'scan', 'findings'];
for (const field of requiredFields) {
  if (!data[field]) {
    throw new Error(`Missing required field: ${field}`);
  }
}
```

## Support

For integration support:
- Email: integrations@petvision.ai
- Documentation: https://docs.petvision.ai/integration
- Slack: #petvision-integrations
