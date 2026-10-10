"""Package platform-specific installers and audio devices for end users."""
import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
version = json.loads((root / "package.json").read_text(encoding="utf-8"))["version"]
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist"
platform = sys.argv[2] if len(sys.argv) > 2 else 'Windows'
assert platform in ('Windows', 'macOS')
installer = destination / f"Wander_scope-Setup-{version}.exe"
if platform == 'Windows' and not installer.is_file():
    raise SystemExit("Build installer/build.ps1 first.")
device_names = ["AbletonDeck Meter.amxd", "yfc-meter.js", "yfc-panel.js"]
readme = f"""Wander_scope {version} beta - by Wanderwave
Audio meters and visuals for Ableton Live + Stream Deck.

REQUIREMENTS
Stream Deck app 6.6+; Ableton Live 11/12: Lite, Intro, Standard or Suite.
VST3 does not require Max for Live. AMXD is an optional alternative.
Windows 10/11 or macOS 13+. macOS VST3 is universal (Intel + Apple Silicon).
The standard HUD has 15 keys (5 x 3).
Earlier AMXD was used in Windows Live 12 Suite. This new VST3 passes automated
Windows/Intel Mac/Apple Silicon tests; manual Live 11/12 edition checks are pending.

INSTALL
1. Extract this entire ZIP. Close Stream Deck from its system tray.
2. Run Wander_scope-Setup-{version}.exe. Select your existing Ableton
   User Library (Live Settings > Library), then click Install / Update.
3. Open Stream Deck. Accept and select Wander_scope HUD.
   All 15 keys are already arranged; your existing profiles are preserved.
4. Restart Live. Enable VST3 system folders in Live Settings > Plug-Ins.
   Add Wander_scope VST3 last on Main/Master. If it is missing, set the VST3
   custom folder to %LOCALAPPDATA%/Programs/Common/VST3, then rescan.
   Use one audio source per project: VST3 OR AMXD, never both.
   Suite / Standard with Max for Live may instead drag the AMXD onto Main.
   Keep both JS files beside the AMXD.
5. For Play/Pause and BPM: Live Settings > Link, Tempo & MIDI >
   Control Surface: AbletonDeck; Input: None; Output: None.

USE
Play audio through Main/Master. VST3 passes audio through unchanged.
The optional AMXD meter panel shows Sending.
Tap Spectrum or Spectrogram to expand; tap any expanded key to return.
Choose colours and visualizer styles in the Stream Deck key settings.

NOTES
Setup does not install Ableton or Stream Deck. No Node.js or Python needed.
Sample peak is not true peak; integrated LUFS is experimental.
macOS bundle is ad-hoc signed, not Apple-notarized.
Free, MIT licensed. Source, license and notices:
https://github.com/wanderda-source/AbletonDeck
Independent community project, not affiliated with Ableton or Elgato.
"""
if platform == 'macOS':
    package = destination / 'com.personal.abletondeck.streamDeckPlugin'
    vst = root / 'VST3/Wander_scope.vst3'
    if not package.is_file() or not (vst / 'Contents/MacOS/Wander_scope').is_file():
        raise SystemExit('Build and validate the universal macOS VST3 before packaging macOS.')
    a = readme.index('INSTALL\n')
    b = readme.index('\nUSE\n')
    readme = readme[:a] + """INSTALL
1. Extract the ZIP. Double-click com.personal.abletondeck.streamDeckPlugin.
   Accept and select Wander_scope HUD in Stream Deck.
2. Copy VST3/Wander_scope.vst3 to ~/Library/Audio/Plug-Ins/VST3/.
   Create this folder if needed. Save work and restart Live.
   Enable VST3 system folders in Live Settings > Plug-Ins and rescan.
3. Add Wander_scope VST3 last on Main/Master. All Live editions can use it.
4. For Play/Pause and BPM: copy Remote Scripts/AbletonDeck into
   your Ableton User Library/Remote Scripts/ (Settings > Library).
   Restart Live. Select AbletonDeck as Control Surface, Input/Output: None.
5. Suite / Standard with Max for Live can use the AMXD instead of VST3.
   Keep its JS files together. Use exactly one audio source per project.
""" + readme[b:]
archive_path = destination / f"Wander_scope-{platform}-{version}.zip"
with ZipFile(archive_path, "w", ZIP_DEFLATED) as archive:
    if platform == 'Windows':
        archive.write(installer, installer.name)
    else:
        archive.write(package, package.name)
        for directory in ('VST3', 'AbletonDeck'):
            for file in sorted((root / directory).rglob('*')):
                if file.is_file() and '__pycache__' not in file.parts and file.suffix != '.pyc':
                    prefix = 'Remote Scripts/' if directory == 'AbletonDeck' else ''
                    archive.write(file, prefix + file.relative_to(root).as_posix())
    archive.writestr("README.txt", readme.encode("utf-8"))
    for name in device_names:
        archive.write(root / "Max for Live" / name, f"Max for Live/{name}")
with ZipFile(archive_path) as archive:
    assert archive.testzip() is None
    if platform == 'Windows':
        assert len(archive.namelist()) == 5
        assert archive.read(installer.name) == installer.read_bytes()
    for name in device_names:
        assert archive.read(f"Max for Live/{name}") == (root / "Max for Live" / name).read_bytes()
digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
(destination / f"{archive_path.name}.sha256").write_text(
    f"{digest}  {archive_path.name}\n", encoding="ascii")
print(f"Verified: {archive_path} ({archive_path.stat().st_size} bytes)")
