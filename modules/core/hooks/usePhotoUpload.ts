import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PhotoUploadOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export interface PhotoUploadResult {
  uri: string;
  width: number;
  height: number;
  type: string;
  fileName?: string;
  fileSize?: number;
}

export const usePhotoUpload = () => {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = useCallback(async (type: 'camera' | 'mediaLibrary') => {
    if (Platform.OS === 'web') {
      return true;
    }
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  }, []);

  const showImageSourceDialog = useCallback((): Promise<'camera' | 'gallery' | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Choose Photo Source',
        'Where would you like to get your photo from?',
        [
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Photo Gallery', onPress: () => resolve('gallery') },
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        ]
      );
    });
  }, []);

  const takePhoto = useCallback(async (options: PhotoUploadOptions = {}): Promise<PhotoUploadResult | null> => {
    try {
      setIsLoading(true);
      const hasPermission = await requestPermissions('camera');
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.', [{ text: 'OK' }]);
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type ?? 'image/jpeg',
          fileName: asset.fileName ?? undefined,
          fileSize: asset.fileSize,
        };
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermissions]);

  const pickFromGallery = useCallback(async (options: PhotoUploadOptions = {}): Promise<PhotoUploadResult | null> => {
    try {
      setIsLoading(true);
      const hasPermission = await requestPermissions('mediaLibrary');
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Photo library permission is required to select photos.', [{ text: 'OK' }]);
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type ?? 'image/jpeg',
          fileName: asset.fileName ?? undefined,
          fileSize: asset.fileSize,
        };
      }
      return null;
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermissions]);

  const uploadPhoto = useCallback(async (options: PhotoUploadOptions = {}): Promise<PhotoUploadResult | null> => {
    try {
      const source = await showImageSourceDialog();
      if (source === 'camera') {
        return await takePhoto(options);
      } else if (source === 'gallery') {
        return await pickFromGallery(options);
      }
      return null;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  }, [showImageSourceDialog, takePhoto, pickFromGallery]);

  return {
    uploadPhoto,
    takePhoto,
    pickFromGallery,
    isLoading,
  };
}; 