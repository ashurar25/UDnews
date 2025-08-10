#!/bin/bash
echo "Building client..."
npm run build

echo "Copying files to server..."
cp -r dist/public/* server/public/

echo "Build and deploy complete!"
echo "The preview should now show your changes."