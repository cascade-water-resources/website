$csvPath = Join-Path $PSScriptRoot "..\data\content_metadata.csv"
$rows = Import-Csv $csvPath

$counts = @{}
foreach ($r in $rows) {
  $h = [string]$r.highlight
  if ($h) { $h = $h.Trim().ToUpper() } else { $h = "" }

  if ($h -eq "TRUE") {
    $s = [string]$r.site_section
    if (-not $counts.ContainsKey($s)) { $counts[$s] = 0 }
    $counts[$s] = $counts[$s] + 1
  }
}

$counts.GetEnumerator() | Sort-Object Name | Format-Table -AutoSize

