import { NextRequest, NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_ID!,
  adminToken: process.env.INSTANTDB_ADMIN_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const chatId = formData.get('chatId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'No chatId provided' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file types
      const supportedTypes = ['text/csv', 'application/json', 'text/markdown', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
      const isSupported = supportedTypes.includes(file.type) || file.name.match(/\.(csv|json|md|xlsx|txt)$/);
      
      if (!isSupported) {
        return NextResponse.json({ 
          error: `Unsupported file type: ${file.name}. Supported: CSV, JSON, Markdown, XLSX, TXT` 
        }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ 
          error: `File too large: ${file.name}. Max size: 10MB` 
        }, { status: 400 });
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload using Admin SDK
      const path = `chat-files/${chatId}/${Date.now()}-${file.name}`;
      const result = await db.storage.uploadFile(path, buffer, {
        contentType: file.type,
      });

      uploadedFiles.push({
        id: result.data.id,
        name: file.name,
        size: file.size,
        type: file.type,
        path: path, // Use the path we created
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: String(error) },
      { status: 500 }
    );
  }
}
