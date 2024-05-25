import pathlib
import json
import sys

cwd = pathlib.Path.cwd()
patch_dir = pathlib.Path.joinpath(cwd, 'public', 'patches')

patch_data_dir = pathlib.Path.joinpath(cwd, 'src')
patch_data_file = pathlib.Path.joinpath(patch_data_dir, 'patches.json')

patch_data = json.load(open(patch_data_file))

patches = [ p.name for p in patch_dir.glob("*.[iIbB][pP][sS]")]

existing = [p['file'] for p in patch_data]

for patch in patches:
    if patch in existing:
        continue
    print(f"\n{patch}")
    new_patch = {}
    new_patch['name']= input("name: ")
    new_patch['file'] = patch
    new_patch['desc']= input("Description: ")
    authors = input("authors (comma separated):")
    new_patch['authors'] = [a.strip() for a in authors.split(',')]
    new_patch['yt'] = ""
    patch_data.append(new_patch)


json.dump(patch_data, open(patch_data_file,'w+'), indent=4)
