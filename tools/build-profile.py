"""Build a portable, single-page 15-key HUD in Stream Deck's native export format."""
import json
from pathlib import Path
from uuid import UUID, uuid5
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / 'com.personal.abletondeck.sdPlugin'
NAMESPACE = UUID('1dd35417-4e1b-4568-af80-7fa9066b456c')
profile_id = str(uuid5(NAMESPACE, 'HUD')).upper()
page_id = str(uuid5(NAMESPACE, 'HUD page')).upper()
pinned_id = str(uuid5(NAMESPACE, 'HUD pinned')).upper()
manifest = json.loads((PLUGIN / 'manifest.json').read_text(encoding='utf-8'))
names = {a['UUID']: a['Name'] for a in manifest['Actions']}
rows = [
    ['click', 'peak', 'reactive', 'lufs', 'spectrogram'],
    ['spectrum1', 'spectrum2', 'spectrum3', 'spectrum4', 'spectrum5'],
    ['goniometer', 'midside', 'play', 'pitch', 'waveform'],
]
actions = {}
for y, row in enumerate(rows):
    for x, kind in enumerate(row):
        action_uuid = 'com.personal.abletondeck.' + kind
        actions[f'{x},{y}'] = {
            'ActionID': str(uuid5(NAMESPACE, kind)), 'LinkedTitle': True,
            'Name': names[action_uuid],
            'Plugin': {'Name': 'Wander_scope', 'UUID': manifest['UUID'], 'Version': manifest['Version']},
            'Resources': None, 'Settings': {'theme': 'global', **({'visualStyle': 'particles'} if kind == 'reactive' else {})},
            'State': 0, 'States': [{'FontFamily': '', 'FontSize': 12, 'FontStyle': '',
                                  'FontUnderline': False, 'OutlineThickness': 2, 'ShowTitle': False,
                                  'TitleAlignment': 'middle', 'TitleColor': '#ffffff'}],
            'UUID': action_uuid,
        }
package = {'AppVersion': '7.4.2.22730', 'DeviceModel': '20GBA9901', 'DeviceSettings': None,
           'FormatVersion': 1, 'OSType': 'Windows', 'OSVersion': '10.0',
           'RequiredPlugins': [manifest['UUID']]}
profile = {'AppIdentifier': '', 'Device': {'Model': '20GBA9901', 'UUID': str(uuid5(NAMESPACE, 'portable device'))},
           'Name': 'Wander_scope HUD', 'Pages': {'Current': '00000000-0000-0000-0000-000000000000',
           'Default': pinned_id.lower(), 'Pages': [page_id.lower()]}, 'Version': '3.0'}
base = f'Profiles/{profile_id}.sdProfile'
files = {'package.json': package, f'{base}/manifest.json': profile,
         f'{base}/Profiles/{page_id}/manifest.json': {'Controllers': [{'Actions': actions, 'Type': 'Keypad'}], 'Icon': '', 'Name': ''},
         f'{base}/Profiles/{pinned_id}/manifest.json': {'Controllers': [{'Actions': None, 'Type': 'Keypad'}], 'Icon': '', 'Name': ''}}
destination = PLUGIN / 'profiles' / 'Wander_scope HUD.streamDeckProfile'
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, 'w', ZIP_DEFLATED) as archive:
    for name, value in files.items():
        archive.writestr(name, json.dumps(value, ensure_ascii=False, separators=(',', ':')))
print(f'Generated portable HUD: {len(actions)} keys.')

# A separate bundled profile reuses the existing action UUID; no extra sidebar actions.
profile_id = str(uuid5(NAMESPACE, 'Spectrogram')).upper()
page_id = str(uuid5(NAMESPACE, 'Spectrogram page')).upper()
pinned_id = str(uuid5(NAMESPACE, 'Spectrogram pinned')).upper()
tile_template = actions['4,0']
actions = {}
for y in range(3):
    for x in range(5):
        action = json.loads(json.dumps(tile_template))
        action['ActionID'] = str(uuid5(NAMESPACE, f'Spectrogram tile {x},{y}'))
        action['Settings'] = {'expanded': True, 'tileX': x, 'tileY': y, 'theme': 'global'}
        actions[f'{x},{y}'] = action
profile['Name'] = 'Wander_scope Spectrogram'
profile['Pages'] = {'Current': '00000000-0000-0000-0000-000000000000',
                    'Default': pinned_id.lower(), 'Pages': [page_id.lower()]}
base = f'Profiles/{profile_id}.sdProfile'
files = {'package.json': package, f'{base}/manifest.json': profile,
         f'{base}/Profiles/{page_id}/manifest.json': {'Controllers': [{'Actions': actions, 'Type': 'Keypad'}], 'Icon': '', 'Name': ''},
         f'{base}/Profiles/{pinned_id}/manifest.json': {'Controllers': [{'Actions': None, 'Type': 'Keypad'}], 'Icon': '', 'Name': ''}}
with ZipFile(PLUGIN / 'profiles' / 'Wander_scope Spectrogram.streamDeckProfile', 'w', ZIP_DEFLATED) as archive:
    for name, value in files.items():
        archive.writestr(name, json.dumps(value, ensure_ascii=False, separators=(',', ':')))
print('Generated expanded spectrogram: 15 tiles.')

profile_id = str(uuid5(NAMESPACE, 'Spectrum')).upper()
page_id = str(uuid5(NAMESPACE, 'Spectrum page')).upper()
pinned_id = str(uuid5(NAMESPACE, 'Spectrum pinned')).upper()
actions = {}
for y in range(3):
    for x in range(5):
        action = json.loads(json.dumps(tile_template))
        action['UUID'] = f'com.personal.abletondeck.spectrum{x+1}'
        action['Name'] = names[action['UUID']]
        action['ActionID'] = str(uuid5(NAMESPACE, f'Spectrum tile {x},{y}'))
        action['Settings'] = {'expanded': True, 'tileY': y, 'theme': 'global'}
        actions[f'{x},{y}'] = action
profile['Name'] = 'Wander_scope Spectrum'
profile['Pages'] = {'Current': '00000000-0000-0000-0000-000000000000',
                    'Default': pinned_id.lower(), 'Pages': [page_id.lower()]}
base = f'Profiles/{profile_id}.sdProfile'
files = {'package.json': package, f'{base}/manifest.json': profile,
         f'{base}/Profiles/{page_id}/manifest.json': {'Controllers': [{'Actions': actions, 'Type': 'Keypad'}], 'Icon': '', 'Name': ''},
         f'{base}/Profiles/{pinned_id}/manifest.json': {'Controllers': [{'Actions': None, 'Type': 'Keypad'}], 'Icon': '', 'Name': ''}}
with ZipFile(PLUGIN / 'profiles' / 'Wander_scope Spectrum.streamDeckProfile', 'w', ZIP_DEFLATED) as archive:
    for name, value in files.items():
        archive.writestr(name, json.dumps(value, ensure_ascii=False, separators=(',', ':')))
print('Generated expanded spectrum: 15 tiles.')
