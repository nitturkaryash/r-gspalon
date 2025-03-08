#!/bin/bash

# Print Node and npm versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set environment variables
export VITE_CJS_IGNORE_WARNING=true
export NODE_OPTIONS="--max-old-space-size=4096 --no-warnings"

# Clean install dependencies
echo "Installing dependencies..."
npm ci --quiet

# Build the application
echo "Building application..."
npm run build

echo "Build completed!" 