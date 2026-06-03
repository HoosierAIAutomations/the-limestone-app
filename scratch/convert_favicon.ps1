Add-Type -AssemblyName System.Drawing
$currentDir = Get-Location
$srcPath = Join-Path $currentDir "assets\logo-app-ready.jpg"
$destPath = Join-Path $currentDir "assets\favicon.png"

Write-Host "Source: $srcPath"
Write-Host "Destination: $destPath"

$img = [System.Drawing.Image]::FromFile($srcPath)
# Create a resized thumbnail for favicon (192x192 is great for high-res web favicons)
$thumbnail = $img.GetThumbnailImage(192, 192, $null, [System.IntPtr]::Zero)
$thumbnail.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$thumbnail.Dispose()
$img.Dispose()
Write-Host "Favicon convert successful!"
