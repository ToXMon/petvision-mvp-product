// ============================================================================
// Component: PDFShareButton
// Mobile component for sharing PDF reports via React Native
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface PDFShareButtonProps {
  scanResultId: string;
  reportType?: 'summary' | 'detailed';
  onShareComplete?: (method: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  buttonStyle?: any;
  textStyle?: any;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PDFShareButton({
  scanResultId,
  reportType = 'detailed',
  onShareComplete,
  onError,
  disabled = false,
  buttonStyle,
  textStyle,
}: PDFShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);

    try {
      // Generate PDF URL
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

      // Get report ID from headers
      const reportId = response.headers.get('X-Report-ID') || scanResultId;
      const filename = `PetVision-Report-${reportId}.pdf`;

      // Download PDF to local file
      const pdfBuffer = await response.arrayBuffer();
      const base64Pdf = FileSystem.readAsStringAsync(
        FileSystem.cacheDirectory + filename,
        { encoding: FileSystem.EncodingType.Base64 }
      ).catch(() => {
        // Convert ArrayBuffer to Base64
        const binary = String.fromCharCode(...new Uint8Array(pdfBuffer));
        return btoa(binary);
      });

      // Write file to documents directory
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share using expo-sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share PetVision Report`,
          UTI: 'com.adobe.pdf',
        });

        if (onShareComplete) {
          onShareComplete('file');
        }
      } else {
        // Fallback: share the report link
        const reportUrl = `https://app.petvision.ai/reports/${scanResultId}`;
        await Share.share({
          message: `View ${filename} online: ${reportUrl}`,
          url: Platform.OS === 'ios' ? reportUrl : undefined,
          title: 'Share PetVision Report',
        });

        if (onShareComplete) {
          onShareComplete('link');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sharing PDF:', error);
      
      Alert.alert('Share Error', errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      disabled={disabled || isLoading}
      style={[
        {
          backgroundColor: disabled || isLoading ? '#9CA3AF' : '#10B981',
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
          <Text style={{ color: '#FFFFFF', marginRight: 8 }}>📤</Text>
          <Text style={[{ color: '#FFFFFF', fontWeight: '600' }, textStyle]}>
            Share Report
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ----------------------------------------------------------------------------
// Compact Share Button
// ----------------------------------------------------------------------------

interface CompactShareButtonProps {
  scanResultId: string;
  reportType?: 'summary' | 'detailed';
  iconOnly?: boolean;
  buttonStyle?: any;
}

export function CompactShareButton({
  scanResultId,
  reportType = 'summary',
  iconOnly = false,
  buttonStyle,
}: CompactShareButtonProps) {
  return (
    <PDFShareButton
      scanResultId={scanResultId}
      reportType={reportType}
      buttonStyle={[
        {
          backgroundColor: '#10B981',
          width: iconOnly ? 40 : 'auto',
          height: 40,
          paddingHorizontal: iconOnly ? 0 : 16,
        },
        buttonStyle,
      ]}
      textStyle={iconOnly ? { display: 'none' } : undefined}
    />
  );
}

// ----------------------------------------------------------------------------
// Email Share Button
// ----------------------------------------------------------------------------

interface EmailShareButtonProps {
  scanResultId: string;
  reportType?: 'summary' | 'detailed';
  recipientEmail?: string;
  buttonStyle?: any;
}

export function EmailShareButton({
  scanResultId,
  reportType = 'detailed',
  recipientEmail,
  buttonStyle,
}: EmailShareButtonProps) {
  const handleEmailShare = async () => {
    try {
      const reportUrl = `https://app.petvision.ai/reports/${scanResultId}`;
      const subject = `PetVision Health Report - ${reportType === 'summary' ? 'Summary' : 'Full'}`;
      const body = `Please find the PetVision health report at: ${reportUrl}`;

      const emailUrl = `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Check if Linking API is available
      const { Linking } = require('react-native');
      const supported = await Linking.canOpenURL(emailUrl);

      if (supported) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Email app not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email app');
    }
  };

  return (
    <TouchableOpacity
      onPress={handleEmailShare}
      style={[
        {
          backgroundColor: '#3B82F6',
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
      <Text style={{ color: '#FFFFFF', marginRight: 8 }}>✉️</Text>
      <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Email Report</Text>
    </TouchableOpacity>
  );
}

export default PDFShareButton;
