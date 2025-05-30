// Upload API route
import { NextResponse } from 'next/server';
import { saveFile, validateFile } from '@/lib/utils/upload';

/**
 * Handle file upload
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'posts';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!validateFile(file)) {
      return NextResponse.json(
        { error: 'Invalid file. Must be JPG, PNG, or GIF under 5MB' },
        { status: 400 }
      );
    }

    // Save file
    const fileUrl = await saveFile(file, type);

    return NextResponse.json({
      url: fileUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Configure server to handle larger file uploads
export const config = {
  api: {
    bodyParser: false
  }
};