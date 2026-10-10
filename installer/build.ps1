param([string]$OutputDirectory = (Join-Path $PSScriptRoot '..\dist'))
$ErrorActionPreference='Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskCompiler = Join-Path ([Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) 'csc.exe'
if (!(Test-Path -LiteralPath $taskCompiler)) { $taskCompiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe' }
if (!(Test-Path -LiteralPath $taskCompiler)) { throw 'Windows .NET Framework C# compiler was not found' }
$taskOutput = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $taskOutput -Force | Out-Null
python (Join-Path $PSScriptRoot 'payload.py') $taskOutput
if ($LASTEXITCODE -ne 0) { throw 'Payload generation failed' }
$taskVersion = (Get-Content (Join-Path $taskRoot 'package.json') -Raw | ConvertFrom-Json).version
$taskExe = Join-Path $taskOutput "Wander_scope-Setup-$taskVersion.exe"
& $taskCompiler /nologo /target:winexe /optimize+ /platform:anycpu /main:DeckSetup "/out:$taskExe" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.IO.Compression.dll "/resource:$taskOutput\payload.zip,AbletonDeck.payload" (Join-Path $PSScriptRoot 'Setup.cs')
if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed' }
& $taskExe --verify
if ($LASTEXITCODE -ne 0) { throw 'Installer payload verification failed' }
Get-FileHash -LiteralPath $taskExe -Algorithm SHA256 | ForEach-Object { "$($_.Hash.ToLower())  $([IO.Path]::GetFileName($taskExe))" } | Set-Content -LiteralPath (Join-Path $taskOutput 'SHA256SUMS.txt') -Encoding ascii
Write-Output $taskExe
