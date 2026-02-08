# PetVision Health History Timeline - Documentation

A comprehensive UI system for displaying pet health scan history with trend analysis and comparison features.

## Overview

The Timeline system provides pet owners with a visual representation of their pet's health journey over time. It displays scans chronologically, shows health trends between consecutive scans, and enables side-by-side comparison of any two scans.

## Features

- 📅 **Timeline View**: Chronological scan cards with severity indicators
- 📈 **Trend Detection**: Automatic analysis of health improvements/declines
- 🔍 **Filtering & Sorting**: Filter by type, severity, date range
- 🔬 **Scan Comparison**: Side-by-side visual comparison with slider
- 🌓 **Dark/Light Mode**: Full theme support
- ♿ **Accessibility**: WCAG AA compliant
- 📱 **Responsive**: Optimized for both web and mobile

## Installation

### Web (Next.js)

```tsx
import { Timeline } from '@/components/timeline';

<Timeline
  petId="pet-123"
  onScanPress={(scanId) => router.push(`/scans/${scanId}`)}
  onComparePress={(beforeId, afterId) => console.log('compare', beforeId, afterId)}
/>
```

### Mobile (React Native)

```tsx
import { Timeline } from '@/components/timeline';

<Timeline
  petId="pet-123"
  onScanPress={(scanId) => navigation.navigate('ScanDetail', { scanId })}
  onComparePress={(beforeId, afterId) => console.log('compare', beforeId, afterId)}
/>
```

## Components

### Timeline

The main container component that manages all timeline functionality.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `petId` | `string` | ✅ | The pet ID to fetch scans for |
| `onScanPress` | `(scanId: string) => void` | ❌ | Callback when a scan card is pressed |
| `onComparePress` | `(beforeId: string, afterId: string) => void` | ❌ | Callback when comparison is triggered |
| `showFilters` | `boolean` | ❌ | Show/hide filter panel (default: true) |
| `initialDateRange` | `DateRangeFilter` | ❌ | Default time period to show |

### TimelineCard

Individual scan card with expandable details.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `TimelineCardData` | Scan and trend data |
| `onPress` | `() => void` | Card press handler |
| `onExpand` | `() => void` | Expand/collapse handler |
| `onCompare` | `() => void` | Compare selection handler |
| `isSelected` | `boolean` | If selected for comparison |
| `isComparing` | `boolean` | If in comparison mode |

### TimelineFilters

Filter and sort controls.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `filters` | `TimelineFilter` | Current filter state |
| `onFiltersChange` | `(filters: TimelineFilter) => void` | Filter change handler |
| `scanCounts` | `Record<ScanType, number>` | Count of scans per type |
| `severityCounts` | `Record<Severity, number>` | Count of scans per severity |

### TimelineTrend

Trend indicator with arrow and percentage.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `trend` | `TrendData` | Trend information |
| `compact` | `boolean` | Show compact version |

### ScanComparison

Modal for side-by-side scan comparison.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `comparison` | `ScanComparison` | Comparison data |
| `onClose` | `() => void` | Close modal handler |

### TimelineEmptyState

Empty state when no scans exist.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `onScanNow` | `() => void` | Start new scan handler |
| `scanType` | `ScanType` | Optional scan type filter |

## Data Types

```typescript
// Timeline Card Data
interface TimelineCardData {
  scan: ScanResult;
  trend?: TrendData;
  isExpanded: boolean;
}

// Trend Data
interface TrendData {
  type: TrendType; // 'improvement' | 'decline' | 'stable'
  message: string;
  percentageChange?: number;
  findingsChange?: {
    added: number;
    removed: number;
    improved: number;
    worsened: number;
  };
}

// Filter Options
interface TimelineFilter {
  scanTypes?: ScanType[];
  severities?: Severity[];
  dateRange?: DateRangeFilter;
  sortBy?: SortOption;
}
```

## Trend Calculation Logic

The trend system automatically analyzes health changes between consecutive scans.

### Severity Scoring

```typescript
const severityScore = {
  green: 0,   // Healthy
  yellow: 1,  // Attention needed
  red: 2,     // Concern
};
```

### Trend Detection Algorithm

1. **Compare same scan types only**
2. **Calculate severity score difference**
3. **Count findings changes**:
   - New findings in current scan
   - Findings resolved from previous scan
   - Findings with improved severity
   - Findings with worsened severity
4. **Determine trend type**:
   - **Improvement**: Overall severity decreased OR findings resolved/improved
   - **Decline**: Overall severity increased OR new/worsened findings
   - **Stable**: No significant changes

## Service Classes

### TimelineService

Static utility class for timeline operations.

```typescript
static buildTimeline(
  scans: ScanResult[],
  filters: TimelineFilter
): TimelineCardData[]

static filterScans(
  scans: ScanResult[],
  filters: TimelineFilter
): ScanResult[]

static sortScans(
  scans: ScanResult[],
  sortBy: SortOption
): ScanResult[]

static getScanCounts(scans: ScanResult[]): Record<ScanType, number>
static getSeverityCounts(scans: ScanResult[]): Record<Severity, number>

static calculateTrend(
  previousScan: ScanResult,
  currentScan: ScanResult
): TrendData | undefined
```

### ComparisonService

Static utility class for scan comparison.

```typescript
static compareScans(
  beforeScan: ScanResult,
  afterScan: ScanResult
): ScanComparison
```

## Integration with Supabase

### Query Example

```typescript
import { supabase } from '@/lib/supabase';

async function fetchScanHistory(
  petId: string,
  dateRange?: DateRangeFilter
): Promise<ScanResult[]> {
  let query = supabase
    .from('scan_results')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  if (dateRange) {
    const startDate = getStartDateForRange(dateRange);
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}
```

## Filter Options

### Scan Types
- `eye` - Eye health scans
- `skin` - Skin/coat scans
- `teeth` - Dental scans
- `gait` - Movement/mobility scans
- `multi` - Multi-area scans

### Severity Levels
- `green` - Healthy, no concerns
- `yellow` - Attention needed, monitor
- `red` - Concern, consider vet visit

### Date Ranges
- `last_7_days` - Past week
- `last_30_days` - Past month
- `last_6_months` - Past half year
- `all_time` - All history

### Sort Options
- `date_newest` - Most recent first (default)
- `date_oldest` - Oldest first
- `severity_high` - Highest severity first
- `severity_low` - Lowest severity first

## Examples

### Basic Timeline

```tsx
import { Timeline } from '@/components/timeline';

export function PetHealthHistory({ petId }: { petId: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Health History</h1>
      <Timeline petId={petId} />
    </div>
  );
}
```

## License

Part of PetVision project.
