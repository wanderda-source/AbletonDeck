# Wander_scope 0.3.22 beta

Audio meters & visuals for Ableton Live and Stream Deck — by **Wanderwave**.

Formerly AbletonDeck. Existing action IDs, meter filenames and Control Surface names are retained so projects and Stream Deck profiles remain compatible.

Free Stream Deck audio analysis and visuals for Ableton Live. MIT licensed; source included.

![Synthetic example layout](hud-preview.png)

## Features

- Shared-scale FFT spectrum across five adjacent buttons (20 Hz–20 kHz), with row freeze.
- One-key spectrogram with eight seconds of scrolling spectral history.
- Triggered combined-channel oscilloscope, goniometer and Mid/Side energy balance.
- Momentary, short-term and experimental integrated LUFS; sample peak and reset.
- Monophonic frequency-to-note detection with a detune scale.
- Four audio-reactive visualizers: Particles, Ribbon, enlarged Field and Mesh. Select **Visualizer style · this key** in the action settings. Each key can use a different style and palette; all styles move slowly during silence. Existing keys keep Particles.
- Warm metronome icon: static on stop, pulsing to Live BPM during playback. This key is display-only.
- Play / Pause through a Live Remote Script. The action list contains only the 15 keys used by the HUD: Spectrum 1–5, LUFS, Sample Peak, Spectrogram, Mid/Side, Oscilloscope, Goniometer, Frequency → Note, Audio Reactive, Play / Pause and Metronome.

## Requirements and installation

Tested: Windows 10/11, Stream Deck 6.6+, Ableton Live 12 Suite with Max for Live. Other Live versions/editions are unverified. This installer does not support macOS or Stream Deck knobs.

Download Wander_scope-Setup-0.3.22.exe from Releases. Close Stream Deck from its system tray. Run setup, select your existing Ableton User Library (find it in Live Settings > Library) and click Install / Update. No administrator rights, Node.js or Python are required by end users. The installer is currently unsigned.

1. Open Stream Deck and drag Wander_scope actions onto your keys. Arrange Spectrum 1 / 5 through 5 / 5 consecutively from left to right.
2. Save your project and restart Live when convenient.
3. Put User Library > Presets > Audio Effects > Max Audio Effect > AbletonDeck > AbletonDeck Meter.amxd last on Main/Master. Keep yfc-meter.js beside it. Use one meter per project.
4. Optional Live controls: Settings > Link, Tempo & MIDI > Control Surface: AbletonDeck; Input/Output: None. Analysis and audio visuals do not require a Control Surface.

Setup preserves profiles and refuses to overwrite unmarked existing folders. It does not install Ableton, Max or Stream Deck. To remove files, close Stream Deck, run the same setup, select the same User Library and click Remove. Modified files and user settings are preserved. Remove the meter from your Live projects and deselect the Control Surface yourself.

## Measurement limits

The meter measures audio at its insertion point. Put it after the limiter, with the master fader at 0 dB for master-chain measurements. Sample peak is not true peak. Integrated LUFS (I*) is experimental; final export checks should use a verified meter. Pitch detection is monophonic, not chord recognition.

FFT uses a Hann window, stereo mean power and 480 logarithmic display points. At 48 kHz its window is 341 ms and bin spacing approximately 2.93 Hz. Visual scaling does not change audio.

Data is sent locally over loopback UDP 17940–17942; audio files are not recorded or uploaded. Multiple meters compete for the same destination and are unsupported.

## Build from source

### Colour and performance settings

Select a Wander_scope key in Stream Deck to choose **Global palette**, **This key**, and **Performance · all keys**. Available palettes, in order: Original orange, Violet, Purple, Green, Blue, scarlet Red, and White. Each palette except Original orange has its own vertical gradient within its colour family; White uses only neutral greys. The former standalone Gradient selection migrates to Violet. Set **This key → Follow global palette** for shared colours; existing fixed key colours are preserved. Hold an audio visual key to cycle its individual palette. The gradients are static and add no animation timer; spectrogram colours map intensity through the same family of hues.

**Smooth** refreshes the oscilloscope up to 40 times/s, spectrum and particle flow up to 20 times/s, and numeric/control keys up to 8 times/s. **Economy** uses 20, 10, and 4 times/s respectively, with fewer particle trails. Spectrogram history advances at 8 columns/s in both modes. Unchanged images are not sent again. Frames use the original Stream Deck's 72 × 72 pixel output size, retaining smooth vector geometry and white numbers. FFT window, calibration, pitch detection and LUFS calculations are unchanged by the performance setting; FFT and pitch processing run only when relevant keys are visible.

The Max for Live device uses a narrow 150 px panel: **Sending / to Stream Deck** with a pulsing dot while packets are emitted, including silence, or **Idle** if packets stop. Keep both `yfc-meter.js` and `yfc-panel.js` beside the AMXD.

Developers need Windows, Node.js/npm, Python 3 and the Windows .NET Framework C# compiler. From this repository directory:

```powershell
npm ci
Copy-Item node_modules com.personal.abletondeck.sdPlugin -Recurse -Force
python tools/build.py
node tools/test.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File installer/build.ps1
```

EXE and SHA256SUMS.txt appear in dist/. The payload includes the Stream Deck plugin, M4L meter and Remote Script, excluding runtime logs and private settings. Installer tests cover installation, updates, removal, preservation of modified files, ownership checks and failure rollback.

.github/workflows/build-installer.yml builds and tests setup manually or on v* tags, then uploads a downloadable artifact. It does not publish a release automatically.

For a standalone Stream Deck package:

```powershell
npx @elgato/cli pack com.personal.abletondeck.sdPlugin --output dist --force
```

Update package.json, tools/build.py and installer/Setup.cs (including assembly version metadata) together when changing release versions. Keep action UUIDs stable for existing profiles.

Optional preview tools require the npm package sharp. Numeric glyph outlines and PNG assets are already included. Font outline regeneration: install Python fonttools and run python tools/build-font.py.

## License

MIT: see LICENSE. Keep third-party and font notices in com.personal.abletondeck.sdPlugin/THIRD_PARTY.md and its licenses folder when redistributing.

Independent community project; not affiliated with Ableton or Elgato.
