#!/bin/bash

# ============================================================================
# 🧄 Aioli Studio - Setup Script
# Run this from your design-system-project directory
# ============================================================================

echo "🧄 Aioli Studio Setup"
echo "===================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found."
    echo "   Please run this script from your design-system-project directory."
    exit 1
fi

# Check if agents directory exists
if [ ! -d "agents" ]; then
    echo "❌ Error: agents directory not found."
    echo "   Please make sure you have the agent system set up."
    exit 1
fi

echo "📁 Creating src/studio directory..."
mkdir -p src/studio

echo "📋 Copying Studio files..."
cp -v "$(dirname "$0")/src/studio/api-server.js" src/studio/
cp -v "$(dirname "$0")/src/studio/useAgents.js" src/studio/
cp -v "$(dirname "$0")/src/studio/StudioWired.jsx" src/studio/

echo ""
echo "📦 Installing dependencies..."
npm install express cors concurrently

echo ""
echo "📝 Updating package.json scripts..."

# Use node to update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = pkg.scripts || {};
pkg.scripts['studio:api'] = 'node src/studio/api-server.js';
pkg.scripts['studio:dev'] = 'concurrently \"npm run studio:api\" \"npm run dev\"';
pkg.scripts['studio'] = 'npm run studio:dev';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Scripts added to package.json');
"

echo ""
echo "============================================"
echo "✅ Setup complete!"
echo ""
echo "To start Aioli Studio, run:"
echo ""
echo "  npm run studio"
echo ""
echo "This will start:"
echo "  - API Server on http://localhost:3001"
echo "  - Vite Dev Server on http://localhost:5173"
echo ""
echo "============================================"
