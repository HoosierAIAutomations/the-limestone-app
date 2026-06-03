Add-Type -AssemblyName System.Drawing
$currentDir = Get-Location
$srcPath = Join-Path $currentDir "assets\logo-app-ready.jpg"
$destPath = Join-Path $currentDir "assets\icon.png"

Write-Host "Source: $srcPath"
Write-Host "Destination: $destPath"

$img = [System.Drawing.Image]::FromFile($srcPath)
$img.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "Convert successful!"
