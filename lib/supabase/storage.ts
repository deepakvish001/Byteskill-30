import { createClient } from "./client" // Use client for browser-like FormData handling if needed, or server for server actions
import { v4 as uuidv4 } from "uuid"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Helper to extract file path from a Supabase storage URL
export function getPathFromSupabaseUrl(url: string, bucketName: string): string | null {
  const prefix = `${supabaseUrl}/storage/v1/object/public/${bucketName}/`
  if (url.startsWith(prefix)) {
    return url.substring(prefix.length)
  }
  return null
}

export async function uploadFileToSupabase(
  file: File,
  bucketName: string,
  folderPath = "", // e.g., "heroes", "thumbnails"
): Promise<string> {
  const supabase = createClient() // Server client for server actions
  const fileExtension = file.name.split(".").pop()
  const uniqueFileName = `${uuidv4()}.${fileExtension}`
  const fullFilePath = folderPath ? `${folderPath.replace(/\/$/, "")}/${uniqueFileName}` : uniqueFileName

  const { data, error } = await supabase.storage.from(bucketName).upload(fullFilePath, file)

  if (error) {
    console.error("Error uploading file to Supabase Storage:", error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path)

  if (!publicUrlData || !publicUrlData.publicUrl) {
    // Attempt to delete if public URL fails, to prevent orphaned files
    await supabase.storage.from(bucketName).remove([data.path])
    throw new Error("Failed to get public URL for uploaded file.")
  }

  return publicUrlData.publicUrl
}

export async function deleteFileFromSupabase(bucketName: string, filePath: string): Promise<void> {
  if (!filePath) return // Nothing to delete

  const supabase = createClient() // Server client for server actions

  // Check if the filePath is a full URL, and if so, extract the path part
  let actualPath = filePath
  if (filePath.startsWith("http")) {
    const pathFromUrl = getPathFromSupabaseUrl(filePath, bucketName)
    if (!pathFromUrl) {
      console.warn(
        `Cannot delete file: URL ${filePath} does not seem to be a Supabase Storage URL for bucket ${bucketName}.`,
      )
      return
    }
    actualPath = pathFromUrl
  }

  const { error } = await supabase.storage.from(bucketName).remove([actualPath])

  if (error) {
    // It's often okay if the file wasn't found (e.g., already deleted), but log other errors.
    if (error.message !== "The resource was not found") {
      console.error(`Error deleting file ${actualPath} from Supabase Storage bucket ${bucketName}:`, error)
    }
    // Depending on strictness, you might throw new Error(`Failed to delete file: ${error.message}`);
  } else {
    console.log(`Successfully deleted ${actualPath} from ${bucketName}`)
  }
}
