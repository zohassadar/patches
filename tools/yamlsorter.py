import dataclasses
import pathlib
import re
import sys
import yaml

NOTSET = object()
ADDME = "ADDME!"


@dataclasses.dataclass
class Patch:
    name: str | object = NOTSET
    file: str | object = NOTSET
    authors: list[str] | object = NOTSET
    date: str | object = NOTSET
    source: str | object = NOTSET
    yt: str | object = NOTSET
    link: str | object = NOTSET
    desc: str | object = NOTSET
    screenshots: list[str] | object = NOTSET
    tags: list[str] | object = NOTSET
    extras: list[str] | object = NOTSET


ORDER = {
    k.strip(): i
    for i, k in enumerate(
        """
        name
        date
        file
        authors
        source
        yt
        link
        desc
        screenshots
        tags
        extras
        """.strip().splitlines()
    )
}

LIST_ITEMS = ["tags", "authors", "screenshots", "extras"]
MINIMUM = ["name", "file", "authors"]

PATCH_FILES = [p.name for p in pathlib.Path("public/patches/").iterdir()]

print("Validating only patches in patch directory")
for patch_file in PATCH_FILES:
    if re.search(r"\.[bi]ps$", patch_file, flags=re.IGNORECASE):
        continue
    sys.exit(f"patches/{patch_file} not a patch")


SCREENSHOTS = [s.name for s in pathlib.Path("public/screenshots/").iterdir()]
print("Validating only screenshots in screenshot directory")
for screenshot in SCREENSHOTS:
    if re.search(r"\.(png|jpe?g|gif)$", screenshot, flags=re.IGNORECASE):
        continue
    sys.exit(f"screenshots/{screenshot} not a screenshot")

# This isn't used yet
EXTRAS = [s.name for s in pathlib.Path("public/extras/").iterdir()]

with open("src/patches.yaml") as file:
    unparsed = file.read()
    file.seek(0)
    parsed = yaml.safe_load(file)


patches = [Patch(**p) for p in parsed]

print("Validating minimum")
for patch in patches:
    if not any(getattr(patch, key) is NOTSET for key in MINIMUM):
        continue
    sys.exit(f"{patch.name} missing information")


print("Validating unique names")
names = []
for patch in patches:
    if patch.name in names:
        sys.exit(f"{patch.name} duplicate!")
    names.append(patch.name)

print("Validating unique files")
files = []
for patch in patches:
    if patch.file in files:
        sys.exit(f"{patch.name} references duplicate {patch.file}")
    files.append(patch.file)

print("Validating lists are lists")
for patch in patches:
    for item in LIST_ITEMS:
        value = getattr(patch, item, None)
        if value is NOTSET:
            continue
        if isinstance(value, list):
            continue
        sys.exit(f"{patch.name}: {item} should be list, not {type(value).__name__}")

print("Validating patches are present")
for patch in patches:
    if patch.file not in PATCH_FILES:
        sys.exit(f"{patch.name} missing {patch.file}")


print("Validating extas are present")
for patch in patches:
    if patch.extras is NOTSET:
        continue
    for extra in patch.extras:
        if extra not in EXTRAS:
            sys.exit(f"{patch.name} missing extra {extra}")


print("Validating screenshots are present")
screenshots = []
for patch in patches:
    if patch.screenshots is NOTSET:
        continue
    for screenshot in patch.screenshots:
        if screenshot not in SCREENSHOTS:
            sys.exit(f"{patch.name} missing screenshot {screenshot}")
        screenshots.append(screenshots)


# come back to this. use to clean up screenshots directory
# for screenshot in SCREENSHOTS:
#     if screenshot not in screenshots:
#         print(f"screenshots/{screenshot} is not referenced by any patch")


print("Validating tags are valid strings")
for patch in patches:
    if patch.tags is NOTSET:
        continue
    for tag in patch.tags:
        if re.match(r"^[\w.]+$", tag):
            continue
        sys.exit(f"{patch.name}: invalid tag {tag}")


example = [
    l.strip() for l in unparsed.strip().splitlines() if l.strip().startswith("#")
]

sections = re.findall(
    r"^-.*?(?=^-|\Z)",
    unparsed,
    flags=re.DOTALL | re.MULTILINE,
)

sections.sort(key=lambda s: re.search(r"name: .*", s).group().upper())

results = []
for patch_file in PATCH_FILES:
    if patch_file not in files:
        results.append(
            f"- name: {patch_file.split('.')[0]}\n  file: {patch_file}\n  authors:\n  - {ADDME}"
        )
        print(f"{patch_file} missing.  Adding placeholder")

for section in sections:
    subsections = re.findall(
        r"^[- ] ([a-z]+):(\s+.*?)(?=^  [a-z]+:|\Z)",
        section,
        flags=re.DOTALL | re.MULTILINE,
    )
    subsections.sort(key=lambda kv: ORDER[kv[0]])

    normalized = []
    for key, value in subsections:
        if key in LIST_ITEMS:
            value = "\n" + "\n".join(
                "  " + v.strip() for v in value.strip().splitlines()
            )
        normalized.append((key, value))

    result = "\n".join("  " + f"{k}:{v}".strip() for k, v in normalized)
    result = "-" + result[1:]
    results.append(result)


with open("src/patches.yaml", "w+") as file:
    print("\n".join(example), file=file, end="\n\n")
    for section in results[:-1]:
        print(section.strip(), file=file, end="\n\n\n")
    print(results[-1].strip(), file=file)
