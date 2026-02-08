# PetVision PDF Template Customization Guide

## Overview

This guide explains how to customize the PDF report templates to match your branding, content requirements, and visual preferences.

## Template Architecture

Templates are located in `petvision-web/services/templates/`:
- `cover-page-template.html` - Main cover page
- `findings-template.html` - Detailed findings section
- `recommendations-template.html` - Vet recommendations
- `trends-template.html` - Trend analysis and comparisons
- `summary-template.html` - Quick summary (1-page)

## Styling System

### CSS Variables

All templates use CSS variables for easy theming:

```css
:root {
  /* Brand Colors */
  --primary-color: #3b82f6;
  --primary-light: #60a5fa;
  --primary-dark: #2563eb;
  --secondary-color: #8b5cf6;
  
  /* Severity Colors */
  --severity-green: #22c55e;
  --severity-green-bg: #dcfce7;
  --severity-yellow: #eab308;
  --severity-yellow-bg: #fef9c3;
  --severity-red: #ef4444;
  --severity-red-bg: #fee2e2;
  
  /* Text Colors */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-accent: #f0f9ff;
  
  /* Spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;
}
```

### Customizing Colors

To change the brand colors, update the CSS variables in each template:

```html
<style>
  :root {
    --primary-color: #your-brand-color;
    --secondary-color: #your-secondary-color;
  }
</style>
```

### Customizing Fonts

To use custom fonts:

```html
<style>
  @import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap');
  
  :root {
    --font-family: 'YourFont', sans-serif;
  }
</style>
```

## Template Sections

### Cover Page

**Location:** `services/templates/cover-page-template.html`

**Customizable Elements:**
- Logo (top left)
- Header background gradient
- Pet photo display
- Scan metadata layout
- Severity badge design
- Summary statistics

**Example:** Change header background

```html
<!-- Find this section -->
<header class="report-header">
  <div class="header-background"></div>
  
  <!-- In styles -->
  <style>
    .header-background {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      /* Change to your colors */
      background: linear-gradient(135deg, #your-color-1, #your-color-2);
    }
  </style>
</header>
```

### Findings Section

**Location:** `services/templates/findings-template.html`

**Customizable Elements:**
- Table layout and columns
- Severity badges
- Confidence score visualization
- Finding detail sections
- Annotation overlay styles

**Example:** Add custom severity icons

```html
<!-- Replace badge with icon -->
<div class="finding-severity finding-{{severity}}">
  <span class="severity-icon">
    {{#if (eq severity 'green')}}
      ✓
    {{else if (eq severity 'yellow')}}
      !
    {{else}}
      ⚠
    {{/if}}
  </span>
</div>
```

### Recommendations Section

**Location:** `services/templates/recommendations-template.html`

**Customizable Elements:**
- Priority indicators
- Action item checkboxes
- Timeline visualization
- Contact information

**Example:** Add visual timeline

```html
<div class="recommendation-timeline">
  <div class="timeline-item">
    <div class="timeline-marker" data-priority="{{priority}}"></div>
    <div class="timeline-content">
      <span class="timeline-date">{{date}}</span>
      <p class="timeline-action">{{action}}</p>
    </div>
  </div>
</div>
```

### Trends Section

**Location:** `services/templates/trends-template.html`

**Customizable Elements:**
- Trend indicators (↑ ↓ →)
- Comparison charts
- Progress bars
- Historical scan list

**Example:** Custom trend indicators

```html
<span class="trend-indicator trend-{{trend}}">
  {{#if (eq trend 'improvement')}}
    <svg>↑ Improving</svg>
  {{else if (eq trend 'decline')}}
    <svg>↓ Declining</svg>
  {{else}}
    <svg>→ Stable</svg>
  {{/if}}
</span>
```

## Template Variables

### Available Variables

Each template receives these variables:

```javascript
{
  // Report metadata
  reportId: string,
  generatedAt: string,
  reportType: 'summary' | 'detailed',
  
  // Pet information
  pet: {
    id: string,
    name: string,
    breed: string,
    age: string,
    species: 'dog' | 'cat' | 'other',
    avatarUrl: string,
  },
  
  // Scan information
  scan: {
    id: string,
    scanType: 'eye' | 'skin' | 'teeth' | 'gait',
    severity: 'green' | 'yellow' | 'red',
    createdAt: string,
    imageUrl: string,
  },
  
  // Findings
  findings: Array<{
    condition: string,
    description: string,
    severity: 'green' | 'yellow' | 'red',
    confidence: number,
    area?: string,
  }>,
  
  // Recommendations
  recommendations: Array<{
    title: string,
    description: string,
    priority: 'routine' | 'moderate' | 'urgent',
    timeframe?: string,
  }>,
  
  // Trends (optional)
  trends?: {
    direction: 'improvement' | 'decline' | 'stable' | 'none',
    severityChange?: string,
    previousScans?: Array<...>,
  },
  
  // QR Code (optional)
  qrCodeUrl?: string,
  reportUrl?: string,
}
```

### Using Variables in Templates

Templates use Handlebars syntax:

```html
<!-- Simple variable -->
<h2>{{pet.name}}'s Health Report</h2>

<!-- Conditional -->
{{#if qrCodeUrl}}
  <img src="{{qrCodeUrl}}" alt="QR Code" />
{{/if}}

<!-- Loop -->
{{#each findings}}
  <div class="finding finding-{{severity}}">
    <h4>{{condition}}</h4>
    <p>{{description}}</p>
  </div>
{{/each}}

<!-- Comparison -->
{{#if (eq scan.severity 'green')}}
  <span class="badge-green">Healthy</span>
{{else}}
  <span class="badge-alert">Attention Needed</span>
{{/if}}
```

## Custom Page Layouts

### Creating a New Template

1. Create a new HTML file in `services/templates/`
2. Add the standard header/footer
3. Use CSS variables for styling
4. Add template variables where needed
5. Register in `PDFService.ts`

```typescript
// In PDFService.ts
async generateCustomTemplate(data: ReportData): Promise<string> {
  const template = await loadTemplate('custom-template.html');
  return this.renderTemplate(template, data);
}
```

### Adding New Sections

To add a new section to existing templates:

```html
<!-- Add at appropriate location -->
<section class="custom-section">
  <h3>{{customSectionTitle}}</h3>
  {{#each customItems}}
    <div class="custom-item">
      <h4>{{title}}</h4>
      <p>{{content}}</p>
    </div>
  {{/each}}
</section>

<!-- Add styles -->
<style>
  .custom-section {
    margin: 24px 0;
    padding: 16px;
    background: var(--bg-accent);
    border-radius: 8px;
  }
  
  .custom-item {
    margin: 12px 0;
  }
</style>
```

## Printing and Page Breaks

### Controlling Page Breaks

```css
/* Avoid breaking inside elements */
.finding-card {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Force page break before */
.page-break-before {
  break-before: page;
  page-break-before: always;
}

/* Force page break after */
.page-break-after {
  break-after: page;
  page-break-after: always;
}
```

### Page Margins

```css
@page {
  size: A4;
  margin: 20mm;
}

@page :first {
  margin-top: 30mm;
}
```

## Branding Customization

### Logo Customization

```html
<!-- Replace logo section -->
<div class="logo">
  <img src="{{logoUrl}}" alt="Your Logo" class="logo-image" />
</div>

<!-- Or use text logo -->
<div class="logo-text">
  <span class="logo-brand">YourBrand</span>
  <span class="logo-tagline">Health Reports</span>
</div>
```

### Footer Customization

```html
<footer class="report-footer">
  <div class="footer-content">
    <p class="disclaimer">
      {{disclaimerText}}
    </p>
    <div class="footer-links">
      <a href="{{websiteUrl}}">{{companyName}}</a>
      <span>•</span>
      <a href="mailto:{{supportEmail}}">Support</a>
    </div>
  </div>
</footer>
```

## Testing Customizations

### Previewing Changes

```typescript
// Use the preview endpoint
curl -X POST "http://localhost:3000/api/reports/stream-pdf" \
  -H "Content-Type: application/json" \
  -d '{"scan_result_id": "test-scan-id"}'
```

### Validation Checklist

- [ ] All CSS variables are defined
- [ ] Template variables are correctly referenced
- [ ] Page breaks appear in correct locations
- [ ] Colors meet contrast requirements (4.5:1)
- [ ] Fonts are readable at 12pt minimum
- [ ] Images display correctly
- [ ] QR code is scannable (if included)
- [ ] Print layout matches screen view
- [ ] All text is properly aligned
- [ ] Brand elements are consistent

## Common Customizations

### Change Severity Colors

```css
:root {
  --severity-green: #your-green;
  --severity-green-bg: #your-green-light;
  --severity-yellow: #your-yellow;
  --severity-yellow-bg: #your-yellow-light;
  --severity-red: #your-red;
  --severity-red-bg: #your-red-light;
}
```

### Add Watermark

```html
<div class="watermark">
  CONFIDENTIAL
</div>

<style>
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 100px;
    color: rgba(0, 0, 0, 0.05);
    pointer-events: none;
    z-index: 1000;
  }
</style>
```

### Add Signature Area

```html
<div class="signature-section">
  <h3>Veterinarian Signature</h3>
  <div class="signature-lines">
    <div class="signature-line">
      <div class="line"></div>
      <label>Date</label>
    </div>
    <div class="signature-line">
      <div class="line"></div>
      <label>Veterinarian Signature</label>
    </div>
  </div>
</div>
```

## Support

For template customization support:
- Email: support@petvision.ai
- Documentation: https://docs.petvision.ai/templates
- Community: https://community.petvision.ai
