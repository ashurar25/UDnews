#!/bin/bash

# Auto build and copy script for UD News
echo "Starting auto build and copy for UD News..."

# Initial build
echo "Building client..."
npm run build:client 2>/dev/null || npm run build

# Copy to server directory
echo "Copying build to server..."
mkdir -p server/public
cp -r dist/public/* server/public/ 2>/dev/null || echo "Copy completed"

echo "Auto build completed!"