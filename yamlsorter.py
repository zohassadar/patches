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

LIST_ITEMS = [
    "tags",
    "authors",
    "screenshots",
    "extras",
]
MINIMUM = [
    "name",
    "file",
    "authors",
]

PATCH_FILES = [p.name for p in pathlib.Path("public/patches/").iterdir()]

# validate only patches in patch directory
for patch_file in PATCH_FILES:
    if re.search(r"\.[bi]ps$", patch_file, flags=re.IGNORECASE):
        continue
    sys.exit(f"patches/{patch_file} not a patch")


SCREENSHOTS = [s.name for s in pathlib.Path("public/screenshots/").iterdir()]
# validate only screenshots in screenshot directory
for screenshot in SCREENSHOTS:
    if re.search(r"\.(png|jpe?g|gif)$", screenshot, flags=re.IGNORECASE):
        continue
    sys.exit(f"screenshots/{screenshot} not a screenshot")


with open("src/patches.yaml") as file:
    unparsed = file.read()
    file.seek(0)
    parsed = yaml.safe_load(file)


patches = [Patch(**p) for p in parsed]

# validate patches have minimum fields
for patch in patches:
    if not any(getattr(patch, key) is NOTSET for key in MINIMUM):
        continue
    sys.exit(f"{patch.name} missing information")

# validate lists are lists
for patch in patches:
    for item in LIST_ITEMS:
        value = getattr(patch, item, None)
        if value is NOTSET:
            continue
        if isinstance(value, list):
            continue
        sys.exit(f"{patch.name}: {item} should be list, not {type(value).__name__}")

# Validate no placeholders
for patch in patches:
    for author in patch.authors:
        if author == ADDME:
            sys.exit(f"{patch.name} needs info")

# validate unique names
names = []
for patch in patches:
    if patch.name in names:
        sys.exit(f"{patch.name} duplicate!")
    names.append(patch.name)

# validate unique files
files = []
for patch in patches:
    if patch.file in files:
        sys.exit(f"{patch.name} references duplicate {patch.file}")
    files.append(patch.file)


# validate patches are present
for patch in patches:
    if patch.file not in PATCH_FILES:
        sys.exit(f"{patch.name} missing {patch.file}")


# Validate referenced extras exist
EXTRAS = [s.name for s in pathlib.Path("public/extras/").iterdir()]
extras = []
for patch in patches:
    if patch.extras is NOTSET:
        continue
    for extra in patch.extras:
        if extra not in EXTRAS:
            sys.exit(f"{patch.name} missing extra {extra}")
        extras.append(extra)


# Validate referenced screenshots exist
screenshots = []
for patch in patches:
    if patch.screenshots is NOTSET:
        continue
    for screenshot in patch.screenshots:
        if screenshot not in SCREENSHOTS:
            sys.exit(f"{patch.name} missing screenshot {screenshot}")
        screenshots.append(screenshot)

# validate screenshots are referenced
for screenshot in SCREENSHOTS:
    if screenshot not in screenshots:
        print(f"screenshots/{screenshot} is not referenced by any patch")
        # (pathlib.Path("public/screenshots") / screenshot).unlink()

# validate extras are referenced
for extra in EXTRAS:
    if extra not in extras:
        print(f"extras/{extra} is not referenced by any patch")

# print("Validating tags are valid strings")
for patch in patches:
    if patch.tags is NOTSET:
        continue
    for tag in patch.tags:
        if re.match(r"^[\w.]+$", tag):
            continue
        sys.exit(f"{patch.name}: invalid tag {tag}")

# collect and count all tags/authors to test for any case mismatch
# all authors and tags each should have a single case representation
tags = {}
authors = {}
for patch in patches:
    for author in patch.authors:
        authors.setdefault(author.lower(), list()).append(author)
    if patch.tags is NOTSET:
        continue
    for tag in patch.tags:
        tags.setdefault(tag.lower(), list()).append(tag)
for ta in list(authors.values()) + list(tags.values()):
    if len(set(ta)) == 1:
        continue
    print(f"Warning! case disagreement! {' '.join(ta)}")

# print("Authors")
# authors = list(authors.values())
# authors.sort(key=lambda a: len(a), reverse=True)
# for a in authors:
#    print(f"{a[0]:>20}: {len(a)}")
# print("Tags")
# tags = list(tags.values())
# tags.sort(key=lambda t: len(t), reverse=True)
# for t in tags:
#    print(f"{t[0]:>20}: {len(t)}")
# strip top example out to put back later

example = [
    l.strip() for l in unparsed.strip().splitlines() if l.strip().startswith("#")
]

# pull and sort each patch
sections = re.findall(
    r"^-.*?(?=^-|\Z)",
    unparsed,
    flags=re.DOTALL | re.MULTILINE,
)
sections.sort(key=lambda s: re.search(r"name: .*", s).group().upper())


# Add any new patches at the top with placeholder info
results = []
for patch_file in PATCH_FILES:
    if patch_file not in files:
        results.append(
            "\n".join(
                [
                    f"- name: {patch_file.split('.')[0]}",
                    f"  date:",
                    f"  file: {patch_file}",
                    f"  desc:",
                    f"  authors:",
                    f"  - {ADDME}",
                    f"  link:",
                    f"  source:",
                    f"  screenshots:",
                    f"  - {ADDME}",
                    f"  tags:",
                    f"  - {ADDME}",
                ]
            )
        )
        print(f"{patch_file} missing.  Adding placeholder")


# sort subsections, preserving formatting of each section (mainly concerned with desc field)
# normalize list indentation
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

# rewrite with even spacing between sections
with open("src/patches.yaml", "w+") as file:
    print("\n".join(example), file=file, end="\n\n")
    for section in results[:-1]:
        print(section.strip(), file=file, end="\n\n\n")
    print(results[-1].strip(), file=file)
