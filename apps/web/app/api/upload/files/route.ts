import { NextRequest, NextResponse } from 'next/server';
import { init } from '@instantdb/admin';

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_ID!,
  adminToken: process.env.INSTANTDB_ADMIN_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_INSTANTDB_ID || !process.env.INSTANTDB_ADMIN_SECRET) {
      console.error('Missing InstantDB configuration');
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 });
    }

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
    const errors = [];

    for (const file of files) {
      try {
        // Validate file is actually a File object
        if (!file || !(file instanceof File)) {
          errors.push(`Invalid file object: ${file}`);
          continue;
        }

        // Validate file types
        const supportedTypes = ['text/csv', 'application/json', 'text/markdown', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
        const isSupported = supportedTypes.includes(file.type) || file.name.match(/\.(csv|json|md|xlsx|txt)$/);
        
        if (!isSupported) {
          errors.push(`Unsupported file type: ${file.name}. Supported: CSV, JSON, Markdown, XLSX, TXT`);
          continue;
        }

        if (file.size === 0) {
          errors.push(`File is empty: ${file.name}`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          errors.push(`File too large: ${file.name}. Max size: 10MB`);
          continue;
        }

        // Convert file to buffer with timeout
        const arrayBuffer = await Promise.race([
          file.arrayBuffer(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('File read timeout')), 30000)
          )
        ]);
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length === 0) {
          errors.push(`Failed to read file: ${file.name}`);
          continue;
        }

        // Upload using Admin SDK with retry logic
        const path = `chat-files/${chatId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        let result;
        let retries = 3;
        
        while (retries > 0) {
          try {
            result = await db.storage.uploadFile(path, buffer, {
              contentType: file.type || 'application/octet-stream',
            });
            break;
          } catch (uploadError) {
            retries--;
            if (retries === 0) throw uploadError;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!result || !result.data || !result.data.id) {
          errors.push(`Upload failed for ${file.name}: Invalid response from storage`);
          continue;
        }

        uploadedFiles.push({
          id: result.data.id,
          name: file.name,
          size: file.size,
          type: file.type,
          path: path,
        });
      } catch (fileError) {
        console.error(`Error processing file ${file?.name}:`, fileError);
        errors.push(`Failed to process ${file?.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    // Return results with both successes and errors
    if (uploadedFiles.length === 0 && errors.length > 0) {
      return NextResponse.json({
        error: 'All file uploads failed',
        details: errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
