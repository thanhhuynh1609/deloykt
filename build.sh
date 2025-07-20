#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit  # exit on error

echo "🚀 Starting build process..."

# Check Python version
echo "🐍 Python version: $(python --version)"

# Set Python version explicitly
export PYTHON_VERSION=3.10.13

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip

# Install Pillow first with pre-compiled wheel
echo "📦 Installing Pillow with pre-compiled wheel..."
pip install --only-binary=Pillow Pillow>=9.0.0,<11.0.0

# Install other dependencies
echo "📦 Installing remaining dependencies..."
pip install -r requirements.txt

# Install Node.js and build frontend
echo "🔧 Installing Node.js dependencies and building frontend..."
cd frontend

# Install dependencies
npm ci --only=production

# Build React app
npm run build

# Go back to root directory
cd ..

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "🗄️ Running database migrations..."
python manage.py migrate

echo "🔧 Creating cache directories..."
mkdir -p ai_cache
mkdir -p media
mkdir -p logs

echo "✅ Build completed successfully!"
