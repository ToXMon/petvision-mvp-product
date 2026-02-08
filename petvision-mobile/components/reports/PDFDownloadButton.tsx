// ============================================================================
// Component: PDFDownloadButton
// Mobile component for downloading PDF reports via React Native
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface PDFDownloadButtonProps {
  scanResultId: string;
  reportType?: 'summary' | 'detailed';
  onDownloadComplete?: (filePath: string, reportId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  buttonStyle?: any;
  textStyle?: any;
  showFileName?: boolean;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PDFDownloadButton({
  scanResultId,
  reportType = 'detailed',
  onDownloadComplete,
  onError,
  disabled = false,
  buttonStyle,
  textStyle,
  showFileName = false,
}: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'PetVision needs storage permission to save PDF reports.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const handleDownload = async () => {
    setIsLoading(true);
    setDownloadedPath(null);

    try {
      // Request storage permission on Android
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Storage permission denied');
      }

      // Generate PDF
      const apiUrl = `https://app.petvision.ai/api/reports/generate-pdf`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scan_result_id: scanResultId,
          report_type: reportType,
          include_qr_code: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get report ID
      const reportId = response.headers.get('X-Report-ID') || scanResultId;
      const filename = `PetVision-Report-${reportId}.pdf`;

      // Download PDF to local file
      const pdfBuffer = await response.arrayBuffer();
      const base64Pdf = btoa(
        String.fromCharCode(...new Uint8Array(pdfBuffer))
      );

      // Save to downloads directory
      const downloadDir = FileSystem.downloadDirectory || FileSystem.documentDirectory;
      const filePath = `${downloadDir}${filename}`;

      await FileSystem.writeAsStringAsync(filePath, base64Pdf, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // On Android, save to media library (optional)
      if (Platform.OS === 'android') {
        try {
          const assetInfo = await MediaLibrary.createAssetAsync(filePath);
          await MediaLibrary.createAlbumAsync('PetVision Reports', assetInfo, false);
        } catch (err) {
          console.warn('Failed to add to media library:', err);
        }
      }

      setDownloadedPath(filePath);

      Alert.alert(
        'Download Complete',
        `PDF saved as:\n${filename}`,
        [
          { text: 'OK', onPress: () => {} },
        ]
      );

      if (onDownloadComplete) {
        onDownloadComplete(filePath, reportId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error downloading PDF:', error);
      
      Alert.alert('Download Error', errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handleDownload}
        disabled={disabled || isLoading}
        style={[
          {
            backgroundColor: disabled || isLoading ? '#9CA3AF' : '#3B82F6',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
          buttonStyle,
        ]}
      >
        {isLoading ? (
          <>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={[{ color: '#FFFFFF', marginLeft: 8 }, textStyle]}>
              Generating...
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: '#FFFFFF', marginRight: 8 }}>📥</Text>
            <Text style={[{ color: '#FFFFFF', fontWeight: '600' }, textStyle]}>
              Download {reportType === 'summary' ? 'Summary' : 'Full'} Report
            </Text>
          </>
        )}
      </TouchableOpacity>

      {showFileName && downloadedPath && (
        <Text style={{ marginTop: 8, fontSize: 12, color: '#10B981', textAlign: 'center' }}>
          ✓ Saved to Downloads
        </Text>
      )}
    </View>
  );
}

// ----------------------------------------------------------------------------
// Quick Download Variants
// ----------------------------------------------------------------------------

interface QuickDownloadButtonProps {
  scanResultId: string;
  buttonStyle?: any;
}

export function QuickDownloadButton({
  scanResultId,
  buttonStyle,
}: QuickDownloadButtonProps) {
  return (
    <PDFDownloadButton
      scanResultId={scanResultId}
      reportType="summary"
      buttonStyle={[
        {
          backgroundColor: '#10B981',
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        buttonStyle,
      ]}
      textStyle={{ fontSize: 14 }}
    />
  );
}

// ----------------------------------------------------------------------------
// Full Report Download Button
// ----------------------------------------------------------------------------

interface FullReportDownloadButtonProps {
  scanResultId: string;
  buttonStyle?: any;
}

export function FullReportDownloadButton({
  scanResultId,
  buttonStyle,
}: FullReportDownloadButtonProps) {
  return (
    <PDFDownloadButton
      scanResultId={scanResultId}
      reportType="detailed"
      buttonStyle={[
        {
          backgroundColor: '#6366F1',
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        buttonStyle,
      ]}
    />
  );
}

// ----------------------------------------------------------------------------
// Icon-only Download Button
// ----------------------------------------------------------------------------

interface IconDownloadButtonProps {
  scanResultId: string;
  reportType?: 'summary' | 'detailed';
  iconStyle?: any;
}

export function IconDownloadButton({
  scanResultId,
  reportType = 'summary',
  iconStyle,
}: IconDownloadButtonProps) {
  return (
    <PDFDownloadButton
      scanResultId={scanResultId}
      reportType={reportType}
      buttonStyle={[
        {
          backgroundColor: 'transparent',
          width: 40,
          height: 40,
          paddingHorizontal: 0,
          paddingVertical: 0,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#3B82F6',
        },
        iconStyle,
      ]}
      textStyle={{ fontSize: 20 }}
    />
  );
}

export default PDFDownloadButton;
