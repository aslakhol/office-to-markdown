#!/usr/bin/env bash
set -euo pipefail

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

# shellcheck source=/dev/null
source .venv/bin/activate

python -m pip install --quiet -r requirements.txt
python -m unittest discover -s tests -p "test_*.py" -v
