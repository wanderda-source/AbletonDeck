"""Copy a validated platform VST3 bundle into the distribution input folder."""
import shutil
import sys
import subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[1]
build = Path(sys.argv[1]).resolve()
sdk = Path(sys.argv[2]).resolve()
bundles = [p for p in build.glob('VST3/**/Wander_scope.vst3') if p.is_dir() and (p / 'Contents').is_dir()]
if len(bundles) != 1:
    raise SystemExit(f'Expected exactly one built VST3 bundle, found {bundles}')
destination = root / 'VST3/Wander_scope.vst3'
if destination.exists():
    # Generated binaries only; never an installed/user directory.
    assert destination.resolve().parent == (root / 'VST3').resolve()
    shutil.rmtree(destination)
shutil.copytree(bundles[0], destination)
notices = destination / 'Contents/Resources'
notices.mkdir(exist_ok=True)
shutil.copyfile(sdk / 'LICENSE.txt', notices / 'VST3-SDK-LICENSE.txt')
print(f'Staged: {destination}')

if sys.platform == 'darwin':
    subprocess.run(['codesign', '--force', '--sign', '-', str(destination)], check=True)
