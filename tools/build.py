"""Generate Max patch, AMXD container, icons and Stream Deck manifest."""
import json
import struct
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / 'com.personal.abletondeck.sdPlugin'
MAX = ROOT / 'Max for Live'
boxes, lines = [], []


def box(name, text, x, y, width=175, **attrs):
    boxes.append({'box': {'id': name, 'maxclass': 'newobj', 'text': text,
                          'patching_rect': [x, y, width, 22], **attrs}})
    return name


def connect(source, outlet, dest, inlet=0):
    lines.append({'patchline': {'source': [source, outlet], 'destination': [dest, inlet]}})


def comment(name, text, rect, size=14, color=None):
    attrs = {'id': name, 'maxclass': 'comment', 'text': text, 'patching_rect': rect,
             'presentation': 1, 'presentation_rect': rect, 'fontsize': size,
             'textcolor': color or [0.84, 0.9, 0.96, 1]}
    boxes.append({'box': attrs})


box('input', 'plugin~', 30, 200)
box('output', 'plugout~', 30, 260)
connect('input', 0, 'output', 0)
connect('input', 1, 'output', 1)
box('script', 'js yfc-meter.js', 30, 840, 150)
box('send', 'udpsend 127.0.0.1 17941', 30, 880, 205)
connect('script', 0, 'send')
box('recv', 'udpreceive 17942', 270, 820)
box('route', 'route /yfc/reset', 270, 850)
box('reset', 'reset', 270, 880)
boxes[-1]['box']['maxclass'] = 'message'
connect('recv', 0, 'route'); connect('route', 0, 'reset'); connect('reset', 0, 'script')
box('dsp', 'dspstate~', 230, 200, varname='dsp')
box('dsp_sr', 'prepend samplerate', 230, 240)
connect('input', 0, 'dsp'); connect('dsp', 1, 'dsp_sr'); connect('dsp_sr', 0, 'script')
box('clock', 'qmetro 100', 450, 720)
connect('dsp', 0, 'clock')
box('live', 'live.thisdevice', 450, 200)
connect('live', 0, 'dsp')
box('trigger', 't ' + ' '.join(['b'] * 14), 450, 760, 255)
connect('clock', 0, 'trigger')
box('pack', 'pack ' + ' '.join(['0.'] * 14), 450, 800, 490)
box('frame', 'prepend frame', 450, 840)
connect('pack', 0, 'frame'); connect('frame', 0, 'script')
for c in range(2):
    box(f'shelf{c}', 'biquad~ 1 0 0 0 0', 30+c*210, 320, varname=f'shelf{c}')
    box(f'hp{c}', 'biquad~ 1 0 0 0 0', 30+c*210, 355, varname=f'hp{c}')
    box(f'square{c}', '*~', 30+c*210, 390)
    connect('input', c, f'shelf{c}'); connect(f'shelf{c}', 0, f'hp{c}')
    connect(f'hp{c}', 0, f'square{c}', 0); connect(f'hp{c}', 0, f'square{c}', 1)
box('energy', '+~', 30, 425)
connect('square0', 0, 'energy', 0); connect('square1', 0, 'energy', 1)
for j, mode in enumerate(('m', 's')):
    box(f'avg_{mode}', f'average~ {80000 if mode == "m" else 600000} bipolar', 30+j*210, 460, 205, varname=f'avg_{mode}')
    box(f'snap_{mode}', 'snapshot~', 30+j*210, 495)
    connect('energy', 0, f'avg_{mode}'); connect(f'avg_{mode}', 0, f'snap_{mode}')
    connect('trigger', j, f'snap_{mode}'); connect(f'snap_{mode}', 0, 'pack', j)
for c in range(2):
    box(f'peak{c}', 'peakamp~', 30+c*210, 550)
    connect('input', c, f'peak{c}')
    connect('trigger', 2+c, f'peak{c}'); connect(f'peak{c}', 0, 'pack', 2+c)
for j in range(8):
    x = 520 + j*220
    for c in range(2):
        box(f'band{j}_{c}', 'biquad~ 1 0 0 0 0', x, 200+c*80, varname=f'band{j}_{c}')
        box(f'bsq{j}_{c}', '*~', x, 235+c*80)
        connect('input', c, f'band{j}_{c}')
        connect(f'band{j}_{c}', 0, f'bsq{j}_{c}', 0)
        connect(f'band{j}_{c}', 0, f'bsq{j}_{c}', 1)
    box(f'bsum{j}', '+~', x, 365)
    connect(f'bsq{j}_0', 0, f'bsum{j}', 0); connect(f'bsq{j}_1', 0, f'bsum{j}', 1)
    box(f'avg_band{j}', 'average~ 20000 bipolar', x, 400, 205, varname=f'avg_band{j}')
    box(f'bsnap{j}', 'snapshot~', x, 440)
    connect(f'bsum{j}', 0, f'avg_band{j}'); connect(f'avg_band{j}', 0, f'bsnap{j}')
    connect('trigger', j+4, f'bsnap{j}'); connect(f'bsnap{j}', 0, 'pack', j+4)
# Unweighted, orthonormal Mid/Side power. Measurements use every audio sample.
for j, name in enumerate(('mid', 'side')):
    box(f'ms_{name}', '+~' if name == 'mid' else '-~', 520+j*220, 490)
    connect('input', 0, f'ms_{name}', 0); connect('input', 1, f'ms_{name}', 1)
    box(f'ms_norm_{name}', '*~ 0.7071067811865476', 520+j*220, 525, 205)
    connect(f'ms_{name}', 0, f'ms_norm_{name}')
    box(f'ms_sq_{name}', '*~', 520+j*220, 560)
    connect(f'ms_norm_{name}', 0, f'ms_sq_{name}', 0); connect(f'ms_norm_{name}', 0, f'ms_sq_{name}', 1)
    box(f'avg_{name}', 'average~ 20000 bipolar', 520+j*220, 595, 205, varname=f'avg_{name}')
    box(f'snap_{name}', 'snapshot~', 520+j*220, 630)
    connect(f'ms_sq_{name}', 0, f'avg_{name}'); connect(f'avg_{name}', 0, f'snap_{name}')
    connect('trigger', 12+j, f'snap_{name}'); connect(f'snap_{name}', 0, 'pack', 12+j)
# Small circular stereo buffer for visual displays; no file recording.
box('scope_buffer', 'buffer~ yfc_scope 400 2', 990, 500, 205, varname='scope_buffer')
box('scope_record', 'record~ yfc_scope 2 @loop 1', 990, 535, 215)
connect('input', 0, 'scope_record', 0); connect('input', 1, 'scope_record', 1)
connect('dsp', 0, 'scope_record')
box('scope_clock', 'qmetro 25', 990, 575, varname='scope_clock')
connect('dsp', 0, 'scope_clock')
box('scope_position', 'snapshot~', 990, 610)
connect('scope_record', 0, 'scope_position'); connect('scope_clock', 0, 'scope_position')
box('scope_message', 'prepend scope', 990, 645)
connect('scope_position', 0, 'scope_message'); connect('scope_message', 0, 'script')
# Spectrum FFT is calculated in Node from the raw stereo capture.
boxes.append({'box': {'id': 'status_panel', 'maxclass': 'jsui',
                     'filename': 'yfc-panel.js', 'numinlets': 1, 'numoutlets': 0,
                     'patching_rect': [30, 930, 150, 169], 'presentation': 1,
                     'presentation_rect': [0, 0, 150, 169], 'border': 0,
                     'ignoreclick': 1,
                     'annotation': 'Wander_scope: sends audio analysis to Stream Deck. Place one instance last on Master/Main.'}})
box('panel_activity', 't b', 270, 930, 45)
connect('script', 0, 'panel_activity')
connect('panel_activity', 0, 'status_panel')
patcher = {'fileversion': 1, 'appversion': {'major': 8, 'minor': 6, 'revision': 5, 'architecture': 'x64', 'modernui': 1},
           'classnamespace': 'box', 'rect': [80, 100, 1120, 1120], 'openinpresentation': 1,
           'devicewidth': 150, 'bgcolor': [0, 0, 0, 1], 'boxes': boxes, 'lines': lines,
           'dependency_cache': [{'name': name, 'type': 'TEXT', 'implicit': 1}
                                for name in ('yfc-meter.js', 'yfc-panel.js')], 'autosave': 0}
text = json.dumps({'patcher': patcher}, ensure_ascii=False, indent=2)
(MAX / 'AbletonDeck Meter.maxpat').write_text(text, encoding='utf-8')
# Standard unfrozen Max Audio Effect AMPF container, with a null-terminated JSON patch.
payload = text.encode('utf-8') + b'\x00'
header = b'ampf' + struct.pack('<I', 4) + b'aaaa' + b'meta' + struct.pack('<I', 4) + struct.pack('<I', 0)
(MAX / 'AbletonDeck Meter.amxd').write_bytes(header + b'ptch' + struct.pack('<I', len(payload)) + payload)
actions = [
    *[(f'spectrum{j}', f'Spectrum {j} / 5') for j in range(1, 6)],
    ('midside','Mid/Side Balance'), ('waveform','Oscilloscope'), ('spectrogram','Spectrogram'), ('goniometer','Goniometer'),
    ('lufs','LUFS Meter'), ('peak','Sample Peak'), ('pitch','Frequency → Note'), ('reactive','Audio Reactive'),
    ('play','Play / Pause'), ('click','Metronome')]
(PLUGIN / 'images').mkdir(exist_ok=True)
manifest = {
    '$schema': 'https://schemas.elgato.com/streamdeck/plugins/manifest.json',
    'Author': 'Wanderwave', 'Name': 'Wander_scope', 'Description': 'Personal Ableton control, stereo LUFS and audio visuals.',
    'Category': 'Wander_scope', 'CategoryIcon': 'images/category', 'Icon': 'images/plugin',
    'URL': 'https://github.com/wanderda-source/AbletonDeck', 'UUID': 'com.personal.abletondeck',
    'Version': '0.4.0.0', 'SDKVersion': 2, 'CodePath': 'plugin.cjs', 'Nodejs': {'Version': '20'},
    'OS': [{'Platform': 'windows', 'MinimumVersion': '10'}, {'Platform': 'mac', 'MinimumVersion': '13'}], 'Software': {'MinimumVersion': '6.6'},
    'PropertyInspectorPath': 'settings.html',
    'Profiles': [{'Name': 'profiles/Wander_scope HUD', 'DeviceType': 0, 'Readonly': False,
                  'AutoInstall': True, 'DontAutoSwitchWhenInstalled': True},
                 {'Name': 'profiles/Wander_scope Spectrogram', 'DeviceType': 0, 'Readonly': True,
                  'AutoInstall': True, 'DontAutoSwitchWhenInstalled': True},
                 {'Name': 'profiles/Wander_scope Spectrum', 'DeviceType': 0, 'Readonly': True,
                  'AutoInstall': True, 'DontAutoSwitchWhenInstalled': True}],
    'Actions': [{'UUID': f'com.personal.abletondeck.{kind}', 'Name': name, 'Icon': f'images/{kind}',
                 'Tooltip': name, 'Controllers': ['Keypad'], 'DisableAutomaticStates': True,
                 'States': [{'Image': f'images/{kind}', 'TitleAlignment': 'middle', 'FontSize': 12}]} for kind, name in actions]
}
(PLUGIN / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
labels = {'midside':'MID / SIDE','waveform':'WAVE','spectrogram':'SPECTROGRAM','vectorscope':'HISTORY','goniometer':'GONIO','lufs':'LUFS','peak':'PEAK','bands':'BANDS','reset':'RESET','play':'PLAY','stop':'STOP','record':'REC',
          'sessionrecord':'S REC','loop':'LOOP','click':'CLICK','mute':'MUTE','solo':'SOLO','arm':'ARM',
          'prev':'PREV','next':'NEXT','scene':'SCENE','stopclips':'STOP CLIP','undo':'UNDO','redo':'REDO','tap':'TAP','overdub':'DUB'}
for kind, name in actions + [('plugin', 'Wander_scope')]:
    label = f'SPEC {kind[-1]}/5' if kind.startswith('spectrum') else labels.get(kind, 'WS')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144"><rect width="144" height="144" rx="17" fill="#000000"/><text x="72" y="82" text-anchor="middle" font-family="Arial" font-weight="700" font-size="24" fill="#f25623">{label}</text></svg>'
    (PLUGIN / 'images' / f'{kind}.svg').write_text(svg, encoding='utf-8')
(PLUGIN / 'images' / 'category.svg').write_text((PLUGIN / 'images' / 'plugin.svg').read_text(encoding='utf-8'), encoding='utf-8')
print(f'Generated {len(actions)} Stream Deck actions; {len(boxes)} Max objects; AMXD {len(payload)+32} bytes.')
subprocess.run(['node', str(ROOT / 'tools' / 'icons.cjs')], check=True)
subprocess.run([sys.executable, str(ROOT / 'tools' / 'build-profile.py')], check=True)
