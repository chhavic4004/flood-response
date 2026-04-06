param(
  [switch]$Railway,
  [switch]$Docker
)

$ErrorActionPreference = "Stop"

if ($Railway) {
  Write-Host "Deploying Setu backend to Railway..."
  railway up
  exit 0
}

if ($Docker) {
  Write-Host "Building and starting Docker service..."
  docker compose up --build -d
  exit 0
}

Write-Host "Usage:"
Write-Host "  ./deploy.ps1 -Railway   # Deploy to Railway"
Write-Host "  ./deploy.ps1 -Docker    # Run via Docker"
