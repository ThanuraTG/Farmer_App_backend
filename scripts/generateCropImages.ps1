param()

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

function Get-HexColor {
  param(
    [Parameter(Mandatory = $true)][string]$Hex,
    [int]$Alpha = 255
  )

  $clean = $Hex.TrimStart('#')
  if ($clean.Length -ne 6) {
    throw "Invalid hex color: $Hex"
  }

  $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function Get-TextLines {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [int]$MaxChars = 20
  )

  $words = $Text -split '\s+'
  $lines = New-Object System.Collections.Generic.List[string]
  $current = ''

  foreach ($word in $words) {
    $candidate = if ([string]::IsNullOrWhiteSpace($current)) { $word } else { "$current $word" }
    if ($candidate.Length -le $MaxChars -or [string]::IsNullOrWhiteSpace($current)) {
      $current = $candidate
      continue
    }

    $lines.Add($current)
    $current = $word
  }

  if (-not [string]::IsNullOrWhiteSpace($current)) {
    $lines.Add($current)
  }

  return $lines
}

function New-RoundedRectanglePath {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.RectangleF]$Rect,
    [float]$Radius = 26
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Get-SeedNumber {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [int]$Salt = 0
  )

  $sum = 0
  foreach ($char in $Text.ToCharArray()) {
    $sum = ($sum * 31 + [int][char]$char + $Salt) % 1000003
  }
  return $sum
}

function Draw-CategoryPattern {
  param(
    [Parameter(Mandatory = $true)]$Graphics,
    [Parameter(Mandatory = $true)][string]$Category,
    [Parameter(Mandatory = $true)][int]$Seed,
    [Parameter(Mandatory = $true)][System.Drawing.Color]$AccentColor
  )

  $pen = New-Object System.Drawing.Pen(([System.Drawing.Color]::FromArgb(80, $AccentColor)), 5)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $brush = New-Object System.Drawing.SolidBrush(([System.Drawing.Color]::FromArgb(80, $AccentColor)))

  try {
    switch -Regex ($Category) {
      'Cereals' {
        for ($i = 0; $i -lt 4; $i++) {
          $x = 430 + ($i * 50) + ($Seed % 9)
          $Graphics.DrawLine($pen, $x, 340, $x + 18, 140)
          for ($j = 0; $j -lt 5; $j++) {
            $offsetY = 170 + ($j * 28)
            $Graphics.DrawLine($pen, $x + 6, $offsetY, $x - 22, $offsetY - 12)
            $Graphics.DrawLine($pen, $x + 12, $offsetY + 8, $x + 34, $offsetY - 4)
          }
        }
        break
      }
      'Field Crops' {
        for ($i = 0; $i -lt 5; $i++) {
          $size = 46 + (($Seed + ($i * 17)) % 16)
          $x = 420 + ($i * 42)
          $y = 180 + (($i % 2) * 45)
          $Graphics.FillEllipse($brush, $x, $y, $size, $size)
        }
        break
      }
      'Vegetables' {
        for ($i = 0; $i -lt 4; $i++) {
          $x = 430 + ($i * 55)
          $y = 165 + (($i % 2) * 48)
          $Graphics.FillEllipse($brush, $x, $y, 58, 76)
          $Graphics.DrawArc($pen, $x + 12, $y - 16, 34, 24, 200, 130)
        }
        break
      }
      'Fruits' {
        for ($i = 0; $i -lt 5; $i++) {
          $size = 54 + (($Seed + ($i * 13)) % 20)
          $x = 408 + (($i % 3) * 74)
          $y = 138 + ([math]::Floor($i / 2) * 74)
          $Graphics.FillEllipse($brush, $x, $y, $size, $size)
        }
        break
      }
      'Plantation' {
        for ($i = 0; $i -lt 4; $i++) {
          $x = 438 + ($i * 58)
          $Graphics.DrawArc($pen, $x, 156, 58, 158, 210, 120)
          $Graphics.DrawArc($pen, $x + 8, 156, 58, 158, 30, 120)
        }
        break
      }
      'Spices' {
        for ($i = 0; $i -lt 6; $i++) {
          $x = 420 + ($i * 38)
          $y = 190 + (($i % 3) * 34)
          $Graphics.FillEllipse($brush, $x, $y, 28, 42)
          $Graphics.DrawLine($pen, $x + 14, $y - 10, $x + 14, $y + 10)
        }
        break
      }
      default {
        $Graphics.FillEllipse($brush, 420, 150, 190, 190)
      }
    }
  } finally {
    $pen.Dispose()
    $brush.Dispose()
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Resolve-Path (Join-Path $scriptDir '..')
$outputDir = Join-Path $backendRoot 'public\crops'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$manifestScript = @"
const { crops, slugifyCropName } = require('./src/seeds/seedCrops');
process.stdout.write(JSON.stringify(
  crops.map((crop) => ({
    name: crop.name.en,
    category: crop.category,
    slug: slugifyCropName(crop.name.en)
  }))
));
"@

Push-Location $backendRoot
try {
  $manifestJson = & node -e $manifestScript
  if ($LASTEXITCODE -ne 0) {
    throw 'Unable to read crop manifest from seedCrops.js'
  }
} finally {
  Pop-Location
}

$crops = $manifestJson | ConvertFrom-Json

$themes = @{
  'Paddy / Cereals' = @{ Primary = '#4E7A47'; Secondary = '#A8C965'; Accent = '#F4E49C' }
  'Field Crops / Other Food Crops' = @{ Primary = '#86542B'; Secondary = '#D28D4A'; Accent = '#F7D8A4' }
  'Vegetables' = @{ Primary = '#1F7A58'; Secondary = '#68B684'; Accent = '#DDF4C5' }
  'Fruits' = @{ Primary = '#AF3E2D'; Secondary = '#F08A5D'; Accent = '#FFD7A8' }
  'Plantation / Export Crops' = @{ Primary = '#2F5B52'; Secondary = '#5E9C76'; Accent = '#D4EBC2' }
  'Spices / Medicinal Crops' = @{ Primary = '#73502C'; Secondary = '#B98A52'; Accent = '#F1D8A7' }
}

$width = 720
$height = 480

foreach ($crop in $crops) {
  $theme = if ($themes.ContainsKey($crop.category)) { $themes[$crop.category] } else { @{ Primary = '#3E6A4A'; Secondary = '#7CAD77'; Accent = '#E5F2D2' } }
  $seed = Get-SeedNumber -Text $crop.name
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $primaryColor = Get-HexColor $theme.Primary
  $secondaryColor = Get-HexColor $theme.Secondary
  $accentColor = Get-HexColor $theme.Accent
  $shadowColor = [System.Drawing.Color]::FromArgb(38, 0, 0, 0)

  $backgroundRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
  $gradientAngle = 25 + ($seed % 35)
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($backgroundRect, $primaryColor, $secondaryColor, $gradientAngle)
  $graphics.FillRectangle($backgroundBrush, $backgroundRect)

  $haloBrush = New-Object System.Drawing.SolidBrush(([System.Drawing.Color]::FromArgb(34, $accentColor)))
  $graphics.FillEllipse($haloBrush, -30, -65, 280, 220)
  $graphics.FillEllipse($haloBrush, 470, 240, 220, 180)
  $graphics.FillEllipse($haloBrush, 545, -25, 160, 140)

  Draw-CategoryPattern -Graphics $graphics -Category $crop.category -Seed $seed -AccentColor $accentColor

  $panelShadow = New-Object System.Drawing.SolidBrush($shadowColor)
  $panelRect = New-Object System.Drawing.RectangleF(38, 268, 470, 158)
  $panelShadowPath = New-RoundedRectanglePath -Rect (New-Object System.Drawing.RectangleF(44, 274, 470, 158)) -Radius 28
  $graphics.FillPath($panelShadow, $panelShadowPath)

  $panelBrush = New-Object System.Drawing.SolidBrush(([System.Drawing.Color]::FromArgb(226, 255, 255, 255)))
  $panelPath = New-RoundedRectanglePath -Rect $panelRect -Radius 28
  $graphics.FillPath($panelBrush, $panelPath)

  $categoryBrush = New-Object System.Drawing.SolidBrush($primaryColor)
  $categoryFont = New-Object System.Drawing.Font('Segoe UI Semibold', 11, [System.Drawing.FontStyle]::Regular)
  $categoryLabel = ($crop.category -split '/')[0].Trim().ToUpperInvariant()
  $graphics.DrawString($categoryLabel, $categoryFont, $categoryBrush, 62, 292)

  $titleFont = New-Object System.Drawing.Font('Segoe UI Semibold', 28, [System.Drawing.FontStyle]::Bold)
  $titleBrush = New-Object System.Drawing.SolidBrush((Get-HexColor '#16311D'))
  $lines = Get-TextLines -Text $crop.name -MaxChars 18
  $lineY = 322
  foreach ($line in $lines) {
    $graphics.DrawString($line, $titleFont, $titleBrush, 58, $lineY)
    $lineY += 40
  }

  $subtitleFont = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Regular)
  $subtitleBrush = New-Object System.Drawing.SolidBrush((Get-HexColor '#4A5C50'))
  $subtitleY = [Math]::Min([Math]::Max($lineY + 4, 386), 404)
  $graphics.DrawString('Farmer Aswanna crop library', $subtitleFont, $subtitleBrush, 62, $subtitleY)

  $badgeRect = New-Object System.Drawing.RectangleF(42, 40, 150, 42)
  $badgePath = New-RoundedRectanglePath -Rect $badgeRect -Radius 21
  $badgeBrush = New-Object System.Drawing.SolidBrush(([System.Drawing.Color]::FromArgb(48, 255, 255, 255)))
  $badgeTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $badgeFont = New-Object System.Drawing.Font('Segoe UI Semibold', 11, [System.Drawing.FontStyle]::Regular)
  $graphics.FillPath($badgeBrush, $badgePath)
  $graphics.DrawString('CROP IMAGE', $badgeFont, $badgeTextBrush, 68, 53)

  $outlinePen = New-Object System.Drawing.Pen(([System.Drawing.Color]::FromArgb(48, 255, 255, 255)), 2)
  $graphics.DrawEllipse($outlinePen, 388, 104, 260, 260)

  $filePath = Join-Path $outputDir "$($crop.slug).png"
  $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)

  $outlinePen.Dispose()
  $badgeFont.Dispose()
  $badgeTextBrush.Dispose()
  $badgeBrush.Dispose()
  $badgePath.Dispose()
  $subtitleBrush.Dispose()
  $subtitleFont.Dispose()
  $titleBrush.Dispose()
  $titleFont.Dispose()
  $categoryBrush.Dispose()
  $categoryFont.Dispose()
  $panelPath.Dispose()
  $panelBrush.Dispose()
  $panelShadowPath.Dispose()
  $panelShadow.Dispose()
  $haloBrush.Dispose()
  $backgroundBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

Write-Output "Generated $($crops.Count) crop images in $outputDir"
