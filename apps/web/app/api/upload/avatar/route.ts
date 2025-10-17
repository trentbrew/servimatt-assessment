import { NextRequest, NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_ID!,
  adminToken: process.env.INSTANTDB_ADMIN_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const agentId = formData.get('agentId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'No agentId provided' },
        { status: 400 },
      );
    }

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using Admin SDK (bypasses permissions)
    const path = `agents/${agentId}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
    
    console.log('Uploading file to path:', path);
    const result = await db.storage.uploadFile(path, buffer, {
      contentType: file.type,
    });
    
    console.log('Upload result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      fileId: result.data.id,
      path: path, // Use the path we created since it might not be in result
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: String(error) },
      { status: 500 },
    );
  }
}
