// Test script for InstantDB file upload
import { init } from '@instantdb/admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env.local' });

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_ID,
  adminToken: process.env.INSTANTDB_API_KEY,
});

async function testUpload() {
  try {
    console.log('🧪 Testing InstantDB Admin SDK upload...');
    
    // Check environment variables
    console.log('App ID:', process.env.NEXT_PUBLIC_INSTANTDB_ID);
    console.log('Admin Token:', process.env.INSTANTDB_API_KEY ? 'Set ✅' : 'Missing ❌');
    
    // Check if image exists
    const imagePath = path.join(__dirname, 'img.png');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found at ${imagePath}`);
    }
    
    console.log('📁 Image found at:', imagePath);
    
    // Read the image file
    const buffer = fs.readFileSync(imagePath);
    console.log('📊 Image size:', buffer.length, 'bytes');
    
    // Upload to InstantDB
    const storagePath = `test-uploads/img-${Date.now()}.png`;
    console.log('⬆️  Uploading to path:', storagePath);
    
    const result = await db.storage.uploadFile(storagePath, buffer, {
      contentType: 'image/png',
    });
    
    console.log('✅ Upload successful!');
    console.log('📄 Result:', JSON.stringify(result, null, 2));
    
    // Test file query
    console.log('🔍 Querying uploaded file...');
    const query = await db.query({
      $files: {
        $: { where: { id: result.data.id } }
      }
    });
    
    console.log('📋 Query result:', JSON.stringify(query, null, 2));
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    console.error('Error details:', error.message);
  }
}

testUpload();
