import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fromByteArray } from 'base64-js';

/**
 * Downloads a binary blob as a file.
 * Supports Web (direct download) and Mobile (save + share).
 */
export const downloadBlob = async (blob: Blob, filename: string): Promise<void> => {
  if (Platform.OS === 'web') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    return;
  }

  // Native Mobile Logic (iOS/Android)
  try {
    // 1. Convert Blob to ArrayBuffer then to Base64
    // Note: React Native Blob.arrayBuffer() is supported in modern versions
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const base64 = fromByteArray(new Uint8Array(arrayBuffer));

    // 2. Define path in document directory
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // 3. Write file
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 4. Check if sharing is available and share
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Guardar ${filename}`,
        UTI: 'com.adobe.pdf', // iOS specific
      });
    } else {
      console.warn('Compartir no está disponible en este dispositivo');
    }
  } catch (error) {
    console.error('Error al guardar/compartir el archivo:', error);
  }
};

/**
 * Shared error logger for consistent error handling across the app.
 */
export const logger = {
  error: (context: string, error: unknown): void => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[${context}]`, error);
    }
  },
  warn: (context: string, message: string): void => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[${context}]`, message);
    }
  },
  info: (context: string, message: string): void => {
    if (process.env.NODE_ENV !== 'test') {
      console.info(`[${context}]`, message);
    }
  },
};
