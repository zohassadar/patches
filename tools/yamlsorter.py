import yaml
import re

with open("src/patches.yaml") as file:
    unparsed = file.read()

example = [l for l in unparsed.strip().splitlines() if l.startswith('#')]

sections = re.findall(
    r"^-.*?(?=^-|\Z)",
    unparsed,
    flags=re.DOTALL | re.MULTILINE,
)

sections.sort(key=lambda s: re.search(r'name: .*', s).group().upper())
with open('src/patches.yaml', 'w+') as file:
    print('\n'.join(example), file=file, end='\n\n')
    for section in sections[:-1]:
        print(section.strip(), file=file, end="\n\n\n")
    print(sections[-1].strip(), end="\n", file=file)
