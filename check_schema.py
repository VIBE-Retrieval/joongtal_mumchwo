import sqlite3

con = sqlite3.connect('backend/app.db')
cur = con.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print('Tables:', tables)

for t in tables:
    cur.execute(f'PRAGMA table_info({t})')
    cols = [(r[1], r[2]) for r in cur.fetchall()]
    print(f'\n{t}: {cols}')

con.close()
