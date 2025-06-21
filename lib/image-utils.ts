import { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"

export function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export async function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<File | null> {
  const canvas = document.createElement("canvas")
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = crop.width * scaleX
  canvas.height = crop.height * scaleY
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return null
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY,
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas is empty")
        resolve(null)
        return
      }
      const croppedFile = new File([blob], fileName, { type: blob.type })
      resolve(croppedFile)
    }, "image/png") // You can change the format here
  })
}
