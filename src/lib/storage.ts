import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads an image file to Firebase Storage and returns its public URL.
 * 
 * @param file The image file from an <input type="file">
 * @param folder The folder path (e.g., 'covers', 'blocks', 'avatars')
 * @param workspaceId The user's workspace ID to keep files organized
 */
export async function uploadImage(file: File, folder: string, workspaceId: string): Promise<string> {
  // Generate a unique file name to prevent overwriting
  const fileExtension = file.name.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
  const fullPath = `workspaces/${workspaceId}/${folder}/${uniqueName}`;

  const storageRef = ref(storage, fullPath);
  
  // Upload the file
  await uploadBytes(storageRef, file);
  
  // Return the URL so we can save it in our Firestore database
  return await getDownloadURL(storageRef);
}

/**
 * Deletes an image from Firebase Storage.
 * Useful for when a user changes their cover image or deletes an image block.
 */
export async function deleteImage(fileUrl: string) {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Failed to delete image:", error);
  }
}