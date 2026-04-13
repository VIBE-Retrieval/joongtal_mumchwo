import os, pathlib
from dotenv import load_dotenv

load_dotenv(pathlib.Path('.env'))

host     = os.environ['DB_HOST']
port     = int(os.environ.get('DB_PORT', 3306))
name     = os.environ['DB_NAME']
user     = os.environ['DB_USER']
password = os.environ['DB_PASSWORD']

import pymysql

sql = pathlib.Path('DB/seeds/demo_seed.sql').read_text(encoding='utf-8')
sql = sql.replace('INSERT OR IGNORE', 'INSERT IGNORE')

# 세미콜론으로 분리, 빈 문장 제거
raw_statements = sql.split(';')
statements = []
for s in raw_statements:
    cleaned = s.strip()
    if not cleaned:
        continue
    # 주석만 있는 블록 제외
    non_comment_lines = [l for l in cleaned.splitlines() if l.strip() and not l.strip().startswith('--')]
    if non_comment_lines:
        statements.append(cleaned)

print(f'총 {len(statements)}개 statements 발견')

con = pymysql.connect(
    host=host, port=port, db=name, user=user, password=password,
    charset='utf8mb4', ssl={'ssl': {}}, ssl_verify_cert=False
)
cur = con.cursor()

ok = 0
for stmt in statements:
    try:
        cur.execute(stmt)
        ok += 1
    except Exception as e:
        print(f'[SKIP] {e}\n  >> {stmt[:120]}')

con.commit()
cur.close()
con.close()
print(f'완료 ({ok}/{len(statements)} statements)')
