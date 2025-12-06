@echo off
setlocal

REM Script to generate PWA icons from a source image
REM Usage: generate-icons.bat source-image.png

set SOURCE_IMAGE=%1
set OUTPUT_DIR=.\public\icons

REM Check if source image is provided
if "%SOURCE_IMAGE%"=="" (
  echo Usage: %0 source-image.png
  exit /b 1
)

REM Check if source image exists
if not exist "%SOURCE_IMAGE%" (
  echo Error: Source image '%SOURCE_IMAGE%' not found
  exit /b 1
)

REM Create output directory
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM Check if ImageMagick is installed
magick -version >nul 2>&1
if errorlevel 1 (
  echo Error: ImageMagick is not installed
  echo Download it from: https://imagemagick.org/script/download.php
  exit /b 1
)

REM Generate icons of different sizes
echo Generating PWA icons...

magick "%SOURCE_IMAGE%" -resize 192x192 "%OUTPUT_DIR%\icon-192x192.png"
magick "%SOURCE_IMAGE%" -resize 256x256 "%OUTPUT_DIR%\icon-256x256.png"
magick "%SOURCE_IMAGE%" -resize 384x384 "%OUTPUT_DIR%\icon-384x384.png"
magick "%SOURCE_IMAGE%" -resize 512x512 "%OUTPUT_DIR%\icon-512x512.png"

echo Icons generated successfully in %OUTPUT_DIR%/
echo Required icons:
dir "%OUTPUT_DIR%"