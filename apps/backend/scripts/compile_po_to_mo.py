#!/usr/bin/env python3
"""
Simple .po to .mo file compiler using struct module.
This is a workaround when GNU gettext tools are not available.
"""
import struct
import re
from pathlib import Path


def parse_po_file(po_path):
    """Parse a .po file and extract translations."""
    translations = {}

    with open(po_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into entries
    entries = re.split(r'\n(?=msgid)', content)

    current_msgid = None
    current_msgstr = None

    for entry in entries:
        lines = entry.strip().split('\n')

        for i, line in enumerate(lines):
            if line.startswith('msgid "'):
                current_msgid = line[7:-1]  # Extract string between quotes
            elif line.startswith('msgstr "'):
                current_msgstr = line[8:-1]  # Extract string between quotes
            elif line.startswith('"') and current_msgid is not None:
                # Continuation lines
                if 'msgid' in lines[i-1] or (i > 0 and lines[i-1].startswith('msgid')):
                    current_msgid += line[1:-1]
                elif current_msgstr is not None:
                    current_msgstr += line[1:-1]

        # Store translation if both msgid and msgstr exist
        if current_msgid and current_msgstr and current_msgid != '':
            translations[current_msgid] = current_msgstr
            current_msgid = None
            current_msgstr = None

    return translations


def compile_mo_file(po_path, mo_path):
    """Compile .po file to .mo file format."""
    translations = parse_po_file(po_path)

    # Build the .mo file format
    # Header: magic number, version, key/value counts, etc.

    keys = sorted(translations.keys())
    offsets = []
    ids_data = b''
    strs_data = b''

    for key in keys:
        key_bytes = key.encode('utf-8')
        value_bytes = translations[key].encode('utf-8')

        offsets.append((len(ids_data), len(key_bytes)))
        ids_data += key_bytes + b'\x00'

        offsets.append((len(strs_data), len(value_bytes)))
        strs_data += value_bytes + b'\x00'

    # Build header
    keyoffset = 7 * 4 + 16 * len(keys)
    valueoffset = keyoffset + len(ids_data)

    # .mo file format
    mo_data = struct.pack(
        'IIIIIII',
        0xde120495,  # Magic
        0,           # Version
        len(keys),   # Number of strings
        7 * 4,       # Offset of table with original strings
        7 * 4 + 8 * len(keys),  # Offset of table with translated strings
        0,           # Size of hashing table
        0            # Offset of hashing table
    )

    # Add key offsets
    for key_offset, key_len in offsets[::2]:
        mo_data += struct.pack('II', key_len, keyoffset + key_offset)

    # Add value offsets
    for value_offset, value_len in offsets[1::2]:
        mo_data += struct.pack('II', value_len, valueoffset + value_offset)

    # Add key and value data
    mo_data += ids_data + strs_data

    # Write .mo file
    with open(mo_path, 'wb') as f:
        f.write(mo_data)

    print(f"✓ Compiled {po_path.name} to {mo_path.name}")
    print(f"  Translations: {len(keys)} entries")


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python compile_po_to_mo.py <po_file> [mo_file]")
        sys.exit(1)

    po_path = Path(sys.argv[1])
    mo_path = Path(sys.argv[2]) if len(sys.argv) > 2 else po_path.with_suffix('.mo')

    if not po_path.exists():
        print(f"Error: {po_path} not found")
        sys.exit(1)

    compile_mo_file(po_path, mo_path)
