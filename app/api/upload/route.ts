import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { successResponse, errorResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file uploaded', 400);
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(
        `Unsupported file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const result = await uploadImageToCloudinary(buffer, {
      folder: 'products',
      width: 1200,
      height: 1200,
    });

    return successResponse(result, 'Image uploaded successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}