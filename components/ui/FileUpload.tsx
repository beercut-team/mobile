import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';

type FileType = 'image' | 'document' | 'all';

interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  onUpload: (file: UploadedFile) => void | Promise<void>;
  accept?: FileType;
  maxSize?: number; // in bytes, default 10MB
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({
  onUpload,
  accept = 'all',
  maxSize = MAX_FILE_SIZE,
  disabled = false,
}: FileUploadProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const fontSize = useAccessibilityFontSize(14);
  const iconSize = useAccessibilityFontSize(48);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<UploadedFile | null>(null);

  const validateFileSize = (size: number): boolean => {
    if (size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      Alert.alert(
        'Файл слишком большой',
        `Максимальный размер файла: ${maxSizeMB} МБ`
      );
      return false;
    }
    return true;
  };

  const handleImagePick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Требуется разрешение', 'Разрешите доступ к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileSize = asset.fileSize || 0;

        if (!validateFileSize(fileSize)) return;

        const file: UploadedFile = {
          uri: asset.uri,
          name: asset.fileName || 'image.jpg',
          type: asset.mimeType || 'image/jpeg',
          size: fileSize,
        };

        setPreview(file);
        setUploading(true);
        await onUpload(file);
        setUploading(false);
      }
    } catch {
      setUploading(false);
      Alert.alert('Ошибка', 'Не удалось загрузить изображение');
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: accept === 'image' ? 'image/*' : '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileSize = asset.size || 0;

        if (!validateFileSize(fileSize)) return;

        const file: UploadedFile = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: fileSize,
        };

        setPreview(file);
        setUploading(true);
        await onUpload(file);
        setUploading(false);
      }
    } catch {
      setUploading(false);
      Alert.alert('Ошибка', 'Не удалось загрузить файл');
    }
  };

  const handlePress = () => {
    if (disabled || uploading) return;

    if (accept === 'image') {
      handleImagePick();
    } else if (accept === 'document') {
      handleDocumentPick();
    } else {
      // Show options for both
      if (Platform.OS === 'web') {
        handleDocumentPick();
      } else {
        Alert.alert('Выберите тип файла', '', [
          { text: 'Изображение', onPress: handleImagePick },
          { text: 'Документ', onPress: handleDocumentPick },
          { text: 'Отмена', style: 'cancel' },
        ]);
      }
    }
  };

  const isImage = preview?.type.startsWith('image/');
  const fileSizeMB = preview ? (preview.size / (1024 * 1024)).toFixed(2) : '0';

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        disabled={disabled || uploading}
        style={({ pressed }) => [
          styles.uploadButton,
          { backgroundColor: colors.muted, borderColor: colors.border },
          pressed && styles.pressed,
          (disabled || uploading) && styles.disabled,
        ]}
      >
        {uploading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : preview ? (
          <View style={styles.previewContainer}>
            {isImage ? (
              <Image source={{ uri: preview.uri }} style={styles.previewImage} />
            ) : (
              <MaterialIcons name="insert-drive-file" size={iconSize} color={colors.icon} />
            )}
            <Text style={[styles.fileName, { color: colors.text, fontSize }]} numberOfLines={1}>
              {preview.name}
            </Text>
            <Text style={[styles.fileSize, { color: colors.mutedForeground, fontSize: fontSize * 0.85 }]}>
              {fileSizeMB} МБ
            </Text>
          </View>
        ) : (
          <View style={styles.uploadPrompt}>
            <MaterialIcons name="cloud-upload" size={iconSize} color={colors.icon} />
            <Text style={[styles.uploadText, { color: colors.text, fontSize }]}>
              {accept === 'image' ? 'Загрузить изображение' :
               accept === 'document' ? 'Загрузить документ' :
               'Загрузить файл'}
            </Text>
            <Text style={[styles.uploadHint, { color: colors.mutedForeground, fontSize: fontSize * 0.85 }]}>
              Макс. {(maxSize / (1024 * 1024)).toFixed(0)} МБ
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  uploadButton: {
    minHeight: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  uploadPrompt: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadHint: {
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  fileName: {
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '100%',
  },
  fileSize: {
    textAlign: 'center',
  },
});
