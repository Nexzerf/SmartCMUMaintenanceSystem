# Exports a .pptx to PDF with PowerPoint (for checking the slides).
# Usage: powershell -File tools/pptx-to-pdf.ps1 <path-to-pptx>
param([string]$Path)
$full = (Resolve-Path $Path).Path
$pdf = [System.IO.Path]::ChangeExtension($full, ".pdf")
$app = New-Object -ComObject PowerPoint.Application
try {
  $p = $app.Presentations.Open($full, $true, $false, $false)
  $p.SaveAs($pdf, 32)
  Write-Output ("slides: " + $p.Slides.Count)
  $p.Close()
} finally {
  $app.Quit()
}
