#!/usr/bin/env python3
"""Exporta crew.db a seed.sql para D1 (solo stdlib).

Uso: python3 scripts/seed-d1.py [data/crew.db] > seed.sql
"""
import sqlite3
import sys

TABLES = ["crew", "forms"]
SKIP = {"pdf_key"}


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    db = sys.argv[1] if len(sys.argv) > 1 else "data/crew.db"
    con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    for table in TABLES:
        try:
            rows = con.execute(f"SELECT * FROM {table}").fetchall()
        except sqlite3.OperationalError:
            continue
        if not rows:
            continue
        cols = [c for c in rows[0].keys() if c not in SKIP]
        collist = ", ".join(cols)
        for r in rows:
            vals = ", ".join(lit(r[c]) for c in cols)
            print(f"INSERT OR REPLACE INTO {table} ({collist}) VALUES ({vals});")


if __name__ == "__main__":
    main()
