#!/bin/bash

# Script to generate PWA icons from a source image
# Usage: ./generate-icons.sh source-image.png

SOURCE_IMAGE=$1
OUTPUT_DIR="./public/icons"

# Check if source image is provided
if [ -z "$SOURCE_IMAGE" ]; then
  echo "Usage: $0 source-image.png"
  exit 1
fi

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: Source image '$SOURCE_IMAGE' not found"
  exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
  echo "Error: ImageMagick is not installed"
  echo "Install it with: sudo apt-get install imagemagick"
  exit 1
fi

# Generate icons of different sizes
echo "Generating PWA icons..."

convert "$SOURCE_IMAGE" -resize 192x192 "$OUTPUT_DIR/icon-192x192.png"
convert "$SOURCE_IMAGE" -resize 256x256 "$OUTPUT_DIR/icon-256x256.png"
convert "$SOURCE_IMAGE" -resize 384x384 "$OUTPUT_DIR/icon-384x384.png"
convert "$SOURCE_IMAGE" -resize 512x512 "$OUTPUT_DIR/icon-512x512.png"

echo "Icons generated successfully in $OUTPUT_DIR/"
echo "Required icons:"
ls -la "$OUTPUT_DIR/"