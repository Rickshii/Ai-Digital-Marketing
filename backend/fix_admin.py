import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/ai_marketing")
cur = conn.cursor()
cur.execute("UPDATE users SET full_name = 'Demo Admin' WHERE email = 'demo@marketerai.com'")
conn.commit()
print("Updated full_name to 'Demo Admin'")

# Verify
cur.execute("SELECT id, email, full_name, role FROM users WHERE email = 'demo@marketerai.com'")
row = cur.fetchone()
print(f"Verified: id={row[0]}, email={row[1]}, name='{row[2]}', role={row[3]}")
conn.close()
