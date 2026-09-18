# Opens a .docx in Word, updates every field and table of contents, saves it, and exports a PDF next to it.
# Usage: powershell -File tools/word-finalize.ps1 <path-to-docx>
param([string]$Path)
$full = (Resolve-Path $Path).Path
$pdf = [System.IO.Path]::ChangeExtension($full, ".pdf")
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($full)
  $doc.Fields.Update() | Out-Null
  foreach ($t in $doc.TablesOfContents) { $t.Update() | Out-Null }
  $doc.Repaginate()
  foreach ($t in $doc.TablesOfContents) { $t.UpdatePageNumbers() | Out-Null }
  $doc.Save()
  $doc.ExportAsFixedFormat($pdf, 17)
  Write-Output ("pages: " + $doc.ComputeStatistics(2))
  $doc.Close()
} finally {
  $word.Quit()
}
Write-Output "pdf: $pdf"
