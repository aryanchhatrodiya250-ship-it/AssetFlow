import os
import re

found = False
for root, dirs, files in os.walk(r"d:\Sem 4\AssetFlow\frontend\src"):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if ":1" in content or "assets/:id" in content or "api/assets" in content:
                    print(f"Found in {filepath}")
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if ":1" in line or "assets/:id" in line or "api/assets" in line:
                            print(f"{i+1}: {line.strip()}")
                    found = True
if not found:
    print("Nothing found.")
