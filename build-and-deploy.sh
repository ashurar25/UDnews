#!/bin/bash

# Build and deploy script for UD News
echo "🔨 Building UD News application..."

# Clean old build
rm -rf dist/public/* server/public/* 2>/dev/null

# Build client
echo "📦 Building React client..."
npm run build

# Copy build to server directory  
echo "📋 Copying build files to server..."
mkdir -p server/public
cp -r dist/public/* server/public/

echo "✅ Build and deploy completed!"
echo "🚀 Application ready to serve from server/public/"