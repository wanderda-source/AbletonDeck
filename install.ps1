param([string]$UserLibrary = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Ableton\User Library'))
$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskTargets = @(
    @{ Source = (Join-Path $taskRoot 'com.personal.abletondeck.sdPlugin'); Destination = (Join-Path $env:APPDATA 'Elgato\StreamDeck\Plugins\com.personal.abletondeck.sdPlugin') },
    @{ Source = (Join-Path $taskRoot 'AbletonDeck'); Destination = (Join-Path $UserLibrary 'Remote Scripts\AbletonDeck') },
    @{ Source = (Join-Path $taskRoot 'Max for Live'); Destination = (Join-Path $UserLibrary 'Presets\Audio Effects\Max Audio Effect\AbletonDeck') }
)
foreach ($taskItem in $taskTargets) {
    if (!(Test-Path -LiteralPath $taskItem.Source)) { throw "Source not found: $($taskItem.Source)" }
    if ((Test-Path -LiteralPath $taskItem.Destination) -and !(Test-Path -LiteralPath (Join-Path $taskItem.Destination '.abletondeck-owned'))) {
        throw "Existing folder is not marked as our installation. Preserved: $($taskItem.Destination)"
    }
}
foreach ($taskItem in $taskTargets) {
    New-Item -ItemType Directory -Path $taskItem.Destination -Force | Out-Null
    Get-ChildItem -LiteralPath $taskItem.Source -Force | Where-Object { $_.Name -ne '__pycache__' } | Copy-Item -Destination $taskItem.Destination -Recurse -Force
    Set-Content -LiteralPath (Join-Path $taskItem.Destination '.abletondeck-owned') -Value 'AbletonDeck 0.3.15' -Encoding utf8
    Write-Output "Installed: $($taskItem.Destination)"
}
Write-Output 'Save your work, then restart Ableton Live and Stream Deck when convenient.'
Write-Output 'Live: Settings > Link, Tempo & MIDI > Control Surface: AbletonDeck; Input/Output: None.'
Write-Output 'Add AbletonDeck Meter.amxd last on Master/Main. Keep yfc-meter.js beside the device.'
