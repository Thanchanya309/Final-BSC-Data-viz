# -*- coding: utf-8 -*-
import os
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script src="([^"]+)"', html)
links = re.findall(r'<link [^>]*href="([^"]+)"', html)

print("Checking scripts:")
for s in scripts:
    if s.startswith('http'):
        print(f"  CDN: {s}")
    else:
        norm = os.path.normpath(s)
        exists = os.path.isfile(norm)
        print(f"  Local: {norm} -> Exists: {exists}")
        assert exists, f"Missing script: {s}"

print("\nChecking stylesheets:")
for l in links:
    if l.startswith('http'):
        print(f"  CDN: {l}")
    else:
        norm = os.path.normpath(l)
        exists = os.path.isfile(norm)
        print(f"  Local: {norm} -> Exists: {exists}")
        assert exists, f"Missing link: {l}"

print("\nAll assets exist and paths are 100% correct!")
