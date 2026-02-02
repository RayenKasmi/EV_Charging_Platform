# Flutter Auth Setup Script

Write-Host "🚀 Setting up Flutter Authentication..." -ForegroundColor Cyan
Write-Host ""

# Check if Flutter is installed
Write-Host "📋 Checking Flutter installation..." -ForegroundColor Yellow
if (!(Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Flutter is not installed or not in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Flutter found" -ForegroundColor Green
Write-Host ""

# Get dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
flutter pub get
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Run build runner
Write-Host "🔧 Generating code with build_runner..." -ForegroundColor Yellow
flutter pub run build_runner build --delete-conflicting-outputs
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Code generation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Code generation completed" -ForegroundColor Green
Write-Host ""

Write-Host "✨ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 To run the app:" -ForegroundColor Cyan
Write-Host "   flutter run" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Make sure backend is running on http://localhost:3000" -ForegroundColor Yellow
Write-Host "   cd ../backend && npm run start:dev" -ForegroundColor White
