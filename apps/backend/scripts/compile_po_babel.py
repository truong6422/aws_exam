#!/usr/bin/env python3
"""
Compile .po file to .mo file using Babel.
"""
from babel.messages import pofile
from pathlib import Path
import sys


def compile_po_to_mo(po_path, mo_path):
    """Compile .po file to .mo file using Babel."""
    po_path = Path(po_path)
    mo_path = Path(mo_path)

    # Read the .po file
    with open(po_path, 'rb') as f:
        catalog = pofile.read_po(f, locale='vi')

    # Write the .mo file
    with open(mo_path, 'wb') as f:
        from babel.messages.mofile import write_mo
        write_mo(f, catalog)

    print(f"✓ Compiled {po_path.name} to {mo_path.name}")
    print(f"  Catalog: {len(catalog)} messages")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python compile_po_babel.py <po_file> [mo_file]")
        sys.exit(1)

    po_path = Path(sys.argv[1])
    mo_path = Path(sys.argv[2]) if len(sys.argv) > 2 else po_path.with_suffix('.mo')

    if not po_path.exists():
        print(f"Error: {po_path} not found")
        sys.exit(1)

    compile_po_to_mo(po_path, mo_path)
