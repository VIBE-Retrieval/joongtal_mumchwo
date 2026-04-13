import os, pathlib
from dotenv import load_dotenv

load_dotenv(pathlib.Path('.env'))

host     = os.environ['DB_HOST']
port     = int(os.environ.get('DB_PORT', 3306))
name     = os.environ['DB_NAME']
user     = os.environ['DB_USER']
password = os.environ['DB_PASSWORD']

import pymysql

DEMO_IDS = ('STU_DEMO_001','STU_DEMO_002','STU_DEMO_003','STU_DEMO_004','STU_DEMO_005')

sql = pathlib.Path('DB/seeds/demo_seed.sql').read_text(encoding='utf-8')
sql = sql.replace('INSERT OR IGNORE', 'INSERT IGNORE')

raw_statements = sql.split(';')
statements = []
for s in raw_statements:
    cleaned = s.strip()
    if not cleaned:
        continue
    non_comment_lines = [l for l in cleaned.splitlines() if l.strip() and not l.strip().startswith('--')]
    if non_comment_lines:
        statements.append(cleaned)

print(f'총 {len(statements)}개 statements 발견')

con = pymysql.connect(
    host=host, port=port, db=name, user=user, password=password,
    charset='utf8mb4', ssl={'ssl': {}}, ssl_verify_cert=False
)
cur = con.cursor()

# 기존 데모 데이터 삭제 (외래키 순서대로)
print('기존 데모 데이터 삭제 중...')
for table in ('intervention_feedback','intervention_history','process_risk_history',
              'interview_risk_history','interview_assessment','daily_survey','students'):
    ids_str = ','.join(f"'{i}'" for i in DEMO_IDS)
    cur.execute(f"DELETE FROM {table} WHERE student_id IN ({ids_str})")
con.commit()
print('삭제 완료')

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
