// Test script for InstantDB file upload
import { init } from '@instantdb/admin';
import fs from 'fs';

console.log('🧪 Testing InstantDB Admin SDK upload...');

// You need to set your actual InstantDB admin secret here
const INSTANTDB_APP_ID = '8357e015-af13-4615-ac4c-b0be9d2a8832';
const INSTANTDB_ADMIN_SECRET = 'YOUR_ADMIN_SECRET_HERE'; // Replace with your actual admin secret

const db = init({
  appId: INSTANTDB_APP_ID,
  adminToken: INSTANTDB_ADMIN_SECRET,
});

async function testUpload() {
  try {
    console.log('📊 App ID:', INSTANTDB_APP_ID);
    console.log('🔑 Admin Token:', INSTANTDB_ADMIN_SECRET === 'YOUR_ADMIN_SECRET_HERE' ? 'Not set ❌' : 'Set ✅');
    
    if (INSTANTDB_ADMIN_SECRET === 'YOUR_ADMIN_SECRET_HERE') {
      console.log('❌ Please update the INSTANTDB_ADMIN_SECRET in test-upload.mjs');
      return;
    }
    
    // Check if image exists
    if (!fs.existsSync('./img.png')) {
      console.log('❌ Image not found at ./img.png');
      return;
    }
    
    console.log('📁 Image found at ./img.png');
    
    // Read the image file
    const buffer = fs.readFileSync('./img.png');
    console.log('📊 Image size:', buffer.length, 'bytes');
    
    // Upload to InstantDB
    const storagePath = `test-uploads/img-${Date.now()}.png`;
    console.log('⬆️  Uploading to path:', storagePath);
    
    const result = await db.storage.uploadFile(storagePath, buffer, {
      contentType: 'image/png',
    });
    
    console.log('✅ Upload successful!');
    console.log('📄 Result structure:');
    console.log('  - File ID:', result.data.id);
    console.log('  - Full result:', JSON.stringify(result, null, 2));
    
    // Test file query
    console.log('🔍 Querying uploaded file...');
    const query = await db.query({
      $files: {
        $: { where: { id: result.data.id } }
      }
    });
    
    console.log('📋 Query result:', JSON.stringify(query, null, 2));
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    if (error.message.includes('Permission denied')) {
      console.log('💡 This means your admin secret is incorrect or not set');
    }
    if (error.message.includes('Network')) {
      console.log('💡 This might be a network or API endpoint issue');
    }
  }
}

testUpload();
