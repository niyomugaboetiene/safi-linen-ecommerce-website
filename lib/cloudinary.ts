import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error('Please define the CLOUDINARY_CLOUD_NAME environment variable');
}

if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error('Please define the CLOUDINARY_API_KEY environment variable');
}

if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Please define the CLOUDINARY_API_SECRET environment variable');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadImageToCloudinary(
  file: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    width?: number;
    height?: number;
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions: any = {
      resource_type: 'image',
      folder: options.folder || 'ecommerce',
      public_id: options.publicId,
      transformation: [
        {
          width: options.width || 1200,
          height: options.height || 1200,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    };

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      const bufferStream = new (require('stream').PassThrough)();
      bufferStream.end(file);
      bufferStream.pipe(uploadStream);
    });

    return {
      url: result.secure_url || result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

export async function deleteMultipleImagesFromCloudinary(
  publicIds: string[]
): Promise<boolean> {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return Object.values(result.deleted).every((status) => status === 'deleted');
  } catch (error) {
    console.error('Cloudinary delete multiple error:', error);
    return false;
  }
}

export default cloudinary;