import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseStorage, getFirebaseFirestore } from './firebase';
import { MediaItem } from '../types';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'Nenhum ficheiro selecionado.' };
  }

  // Size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `O ficheiro excede o tamanho máximo permitido de 5MB (Tamanho atual: ${sizeMb}MB).`,
    };
  }

  // MIME Type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Tipo de ficheiro inválido (${file.type || 'desconhecido'}). São permitidos apenas JPEG, PNG, WebP, GIF e SVG.`,
    };
  }

  // Extension validation
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Extensão de ficheiro não autorizada. Extensões válidas: ${ALLOWED_EXTENSIONS.join(', ')}.`,
    };
  }

  return { valid: true };
}

/**
 * Calculates real pixel dimensions for an image file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml') {
      return resolve({ width: 800, height: 800 });
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 800, height: 600 });
    };
    img.src = url;
  });
}

export const storageService = {
  /**
   * Uploads an image file to Firebase Storage and records metadata in Firestore /media collection
   */
  async uploadImage(
    file: File,
    uploadedBy: string = 'Administrador',
    altText?: string
  ): Promise<MediaItem> {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Validação de imagem falhou.');
    }

    const { width, height } = await getImageDimensions(file);
    const storage = getFirebaseStorage();
    const db = getFirebaseFirestore();
    const mediaId = 'MED-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `media/${Date.now()}_${cleanFileName}`;

    let downloadUrl: string;

    if (storage) {
      try {
        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(storageRef, file, {
          contentType: file.type,
          customMetadata: {
            uploadedBy,
            originalName: file.name,
          },
        });
        downloadUrl = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed, utilizing safe in-memory data URL fallback:', storageErr);
        downloadUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    } else {
      // Offline / unconfigured storage fallback
      downloadUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const mediaItem: MediaItem = {
      id: mediaId,
      fileName: file.name,
      fileUrl: downloadUrl,
      fileType: file.type,
      fileSize: file.size,
      mimeType: file.type,
      width,
      height,
      storagePath,
      uploadedBy,
      altText: altText?.trim() || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      createdAt: new Date().toISOString(),
    };

    // Save metadata in Firestore
    if (db) {
      try {
        const mediaDocRef = doc(db, 'media', mediaId);
        await setDoc(mediaDocRef, {
          ...mediaItem,
          createdAtServer: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Could not save media metadata in Firestore:', err);
      }
    }

    return mediaItem;
  },

  /**
   * Fetches all registered media items from Firestore
   */
  async getMediaLibrary(): Promise<MediaItem[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    try {
      const mediaRef = collection(db, 'media');
      const q = query(mediaRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const items: MediaItem[] = [];
      snap.forEach((docSnap) => {
        items.push(docSnap.data() as MediaItem);
      });
      return items;
    } catch (err) {
      console.warn('Could not fetch media library from Firestore:', err);
      return [];
    }
  },

  /**
   * Deletes a media item from Storage and metadata from Firestore
   */
  async deleteMedia(item: MediaItem): Promise<boolean> {
    const storage = getFirebaseStorage();
    const db = getFirebaseFirestore();

    // Try deleting from Storage if path exists
    if (storage && item.storagePath) {
      try {
        const storageRef = ref(storage, item.storagePath);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn('Could not delete file from Firebase Storage:', err);
      }
    }

    // Delete document in Firestore
    if (db) {
      try {
        const mediaDocRef = doc(db, 'media', item.id);
        await deleteDoc(mediaDocRef);
      } catch (err) {
        console.error('Could not delete media doc in Firestore:', err);
        return false;
      }
    }

    return true;
  },

  /**
   * Updates alternative text (alt text) for an image
   */
  async updateAltText(id: string, altText: string): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!db) return false;

    try {
      const mediaDocRef = doc(db, 'media', id);
      await updateDoc(mediaDocRef, { altText: altText.trim() });
      return true;
    } catch (err) {
      console.error('Could not update altText in Firestore:', err);
      return false;
    }
  },
};
