import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { format } from 'date-fns';
import {
  ScanComparison as ScanComparisonType,
  TrendType,
  TrendColors,
  SeverityColors,
  ScanTypeLabels,
} from '@petvision/shared';
import { TimelineTrend } from './TimelineTrend';

interface ScanComparisonProps {
  comparison: ScanComparisonType;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ScanComparison: React.FC<ScanComparisonProps> = ({ comparison, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeTab, setActiveTab] = useState<'visual' | 'findings'>('visual');

  const { beforeScan, afterScan } = comparison;
  const { timeDifference, findingsComparison, trend } = comparison.comparison;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
  };

  const getSeverityColor = (severity: string) => {
    return SeverityColors[severity as keyof typeof SeverityColors];
  };

  const getTrendColor = () => {
    return TrendColors[trend.type];
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.trendIcon, { backgroundColor: getTrendColor() }]}
            >
              <Text style={styles.trendIconText}>
                {trend.type === TrendType.IMPROVEMENT ? '↑' : trend.type === TrendType.DECLINE ? '↓' : '→'}
              </Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Scan Comparison</Text>
              <Text style={styles.headerSubtitle}>
                {timeDifference.days > 0 ? `${timeDifference.days} days` : `${timeDifference.hours} hours`} between scans
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Trend Summary */}
          <View style={styles.trendSection}>
            <TimelineTrend trend={trend} />
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('visual')}
              style={[
                styles.tab,
                activeTab === 'visual' && styles.tabActive,
              ]}
            >
              <Text style={[styles.tabText, activeTab === 'visual' && styles.tabTextActive]}>
                Visual Comparison
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('findings')}
              style={[
                styles.tab,
                activeTab === 'findings' && styles.tabActive,
              ]}
            >
              <Text style={[styles.tabText, activeTab === 'findings' && styles.tabTextActive]}>
                Findings Comparison
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'visual' && (
            <View style={styles.visualContent}>
              {/* Scan Info Cards */}
              <View style={styles.scanInfoRow}>
                <View style={styles.scanInfoCard}>
                  <Image
                    source={{ uri: beforeScan.thumbnail_url || beforeScan.image_url }}
                    style={styles.scanThumbnail}
                  />
                  <View style={styles.scanInfoText}>
                    <Text style={styles.scanInfoTitle}>
                      {ScanTypeLabels[beforeScan.scan_type]} (Before)
                    </Text>
                    <Text style={styles.scanInfoDate}>{formatDate(beforeScan.created_at)}</Text>
                    <Text style={styles.scanInfoCount}>
                      {beforeScan.findings.length} finding(s)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Image Slider Comparison */}
              <View style={styles.comparisonContainer}>
                <Image
                  source={{ uri: beforeScan.image_url }}
                  style={styles.comparisonImage}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.afterImageContainer,
                    { width: `${sliderPosition}%` },
                  ]}
                >
                  <Image
                    source={{ uri: afterScan.image_url }}
                    style={[styles.comparisonImage, styles.afterImage]}
                    resizeMode="cover"
                  />
                </View>
                
                {/* Slider Handle */}
                <View
                  style={[
                    styles.sliderHandle,
                    { left: `${sliderPosition}%` },
                  ]}
                >
                  <View style={styles.sliderHandleInner}>
                    <Text style={styles.sliderHandleText}>⟷</Text>
                  </View>
                </View>

                {/* Labels */}
                <View style={styles.comparisonLabelLeft}>
                  <Text style={styles.comparisonLabelText}>Before</Text>
                </View>
                <View style={styles.comparisonLabelRight}>
                  <Text style={styles.comparisonLabelText}>After</Text>
                </View>

                {/* Invisible Touchable Slider */}
                <View style={styles.sliderTouchArea}>
                  <Slider value={sliderPosition} onChange={setSliderPosition} />
                </View>
              </View>

              {/* After Scan Info */}
              <View style={styles.scanInfoRow}>
                <View style={styles.scanInfoCard}>
                  <Image
                    source={{ uri: afterScan.thumbnail_url || afterScan.image_url }}
                    style={styles.scanThumbnail}
                  />
                  <View style={styles.scanInfoText}>
                    <Text style={styles.scanInfoTitle}>
                      {ScanTypeLabels[afterScan.scan_type]} (After)
                    </Text>
                    <Text style={styles.scanInfoDate}>{formatDate(afterScan.created_at)}</Text>
                    <Text style={styles.scanInfoCount}>
                      {afterScan.findings.length} finding(s)
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'findings' && (
            <View style={styles.findingsContent}>
              {findingsComparison.newFindings.length > 0 && (
                <View style={styles.findingSection}>
                  <Text style={styles.findingSectionTitle}>
                    New Findings ({findingsComparison.newFindings.length})
                  </Text>
                  {findingsComparison.newFindings.map((f) => (
                    <View key={f.id} style={styles.findingCard}>
                      <Text style={styles.findingCardText}>{f.condition}</Text>
                    </View>
                  ))}
                </View>
              )}
              {findingsComparison.resolvedFindings.length > 0 && (
                <View style={styles.findingSection}>
                  <Text style={styles.findingSectionTitle}>
                    Resolved Findings ({findingsComparison.resolvedFindings.length})
                  </Text>
                  {findingsComparison.resolvedFindings.map((f) => (
                    <View key={f.id} style={[styles.findingCard, styles.findingCardGreen]}>
                      <Text style={styles.findingCardText}>{f.condition}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Simple Slider Component
interface SliderProps {
  value: number;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ value, onChange }) => {
  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
  };

  const handleTouchMove = (event: any) => {
    const { locationX } = event.nativeEvent;
    const percentage = (locationX / screenWidth) * 100;
    onChange(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <View
      style={styles.sliderTouchable}
      onLayout={handleLayout}
      onTouchMove={handleTouchMove}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendIconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  scrollContent: {
    flex: 1,
  },
  trendSection: {
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  visualContent: {
    padding: 16,
  },
  scanInfoRow: {
    marginBottom: 16,
  },
  scanInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  scanThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  scanInfoText: {
    flex: 1,
  },
  scanInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  scanInfoDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scanInfoCount: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  comparisonContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  comparisonImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  afterImageContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  afterImage: {
    left: 0,
  },
  sliderHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderHandleInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderHandleText: {
    fontSize: 18,
    color: '#6B7280',
  },
  comparisonLabelLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  comparisonLabelRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  comparisonLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  sliderTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  sliderTouchable: {
    flex: 1,
  },
  findingsContent: {
    padding: 16,
  },
  findingSection: {
    marginBottom: 24,
  },
  findingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  findingCard: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginBottom: 8,
  },
  findingCardGreen: {
    backgroundColor: '#ECFDF5',
  },
  findingCardText: {
    fontSize: 14,
    color: '#111827',
  },
});

export default ScanComparison;
