#!/bin/bash

# Test the avatar upload API endpoint
echo "🧪 Testing avatar upload API endpoint..."

if [ ! -f "img.png" ]; then
    echo "❌ img.png not found in current directory"
    exit 1
fi

echo "📁 Found img.png, testing upload..."

# Test the API endpoint
curl -X POST \
  http://localhost:1290/api/upload/avatar \
  -F "file=@img.png" \
  -F "agentId=test-agent-123" \
  -v

echo ""
echo "🏁 Test complete!"
