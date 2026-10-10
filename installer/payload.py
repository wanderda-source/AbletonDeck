import sys, json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parents[1]
destination=Path(sys.argv[1])/'payload.zip'
version=json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
assert f'Version="{version}"' in (root/'installer/Setup.cs').read_text(encoding='utf-8'), 'Update installer version to match package.json'
with ZipFile(destination,'w',ZIP_DEFLATED) as archive:
    for name,directory in [('plugin','com.personal.abletondeck.sdPlugin'),('meter','Max for Live'),('remote','AbletonDeck')]:
        for file in sorted((root/directory).rglob('*')):
            if not file.is_file(): continue
            relative=file.relative_to(root/directory)
            if '__pycache__' in relative.parts or file.suffix in ('.pyc','.log') or file.name in ('runtime-status.json','fft-diagnostics.json','meter-connection.json','.abletondeck-owned','.package-lock.json'): continue
            archive.write(file,Path(name)/relative)
with ZipFile(destination) as archive: assert archive.testzip() is None
print(destination)
