#!/bin/bash

echo "🔧 Starting auto-rebuild watcher..."

# Function to build and deploy
build_and_deploy() {
    echo "📦 Building client..."
    npm run build --silent
    echo "📁 Copying to server/public..."
    cp -r dist/public server/
    echo "✅ Build complete at $(date)"
}

# Initial build
build_and_deploy

# Watch for changes in client directory
echo "👀 Watching for changes in client/src..."

if command -v inotifywait &> /dev/null; then
    # Use inotifywait if available
    while inotifywait -r -e modify,create,delete client/src; do
        sleep 1  # Debounce
        build_and_deploy
    done
else
    # Fallback to polling method
    LAST_MODIFIED=$(find client/src -type f -exec stat -f "%m" {} \; | sort -n | tail -1)
    
    while true do
        sleep 2
        CURRENT_MODIFIED=$(find client/src -type f -exec stat -f "%m" {} \; | sort -n | tail -1)
        
        if [ "$CURRENT_MODIFIED" != "$LAST_MODIFIED" ]; then
            echo "🔄 Changes detected..."
            build_and_deploy
            LAST_MODIFIED=$CURRENT_MODIFIED
        fi
    done
fi