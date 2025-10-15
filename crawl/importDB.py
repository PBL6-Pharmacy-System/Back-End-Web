import json
import psycopg2
from psycopg2.extras import Json

# --- CONFIG ---
DATABASE_URL = "postgresql://postgres.eyltylhdtxgywqppylkn:soulof28dec@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
INPUT_FILE = "clean_products.json"

# --- CONNECT ---
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# --- LOAD DATA ---
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    products = json.load(f)

# --- HELPER ---
def get_or_create(table, name):
    if not name:
        return None
    name = name.strip()
    cur.execute(f"SELECT id FROM {table} WHERE name = %s", (name,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(f"INSERT INTO {table} (name) VALUES (%s) RETURNING id", (name,))
    return cur.fetchone()[0]

# --- IMPORT ---
with conn:
    for p in products:
        price = p.get("price")
        if price is None:
            print(f"⚠️ Bỏ qua sản phẩm không có giá: {p.get('name')}")
            continue

        supplier_name = p.get("producer") or p.get("manufacturer")
        supplier_id = get_or_create("suppliers", supplier_name)

        category_name = p.get("category")[-1] if p.get("category") else None
        category_id = get_or_create("categories", category_name)

        base_unit_id = get_or_create("unittype", p.get("unit"))

        images = []
        if p.get("image"):
            images.append(p["image"])
        if p.get("relatedProducts"):
            images.extend([r["image"] for r in p["relatedProducts"] if r.get("image")])

        cur.execute("""
            INSERT INTO products (
                name, description, price, images, category_id, supplier_id, base_unit_id,
                manufacturer, usage, dosage, specification, "adverseEffect", "registNum",
                brand, producer, manufactor, "legalDeclaration", faq
            )
            VALUES (
                %s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s
            )
            RETURNING id
        """, (
            p.get("name"),
            p.get("description"),
            price,
            Json(images),
            category_id,
            supplier_id,
            base_unit_id,
            p.get("manufacturer"),
            p.get("usage"),
            p.get("dosage"),
            p.get("specification"),
            p.get("adverseEffect"),
            p.get("registNum"),
            p.get("brand"),
            p.get("producer"),
            p.get("manufactor"),
            p.get("legalDeclaration"),
            Json(p.get("faq") or [])
        ))
        product_id = cur.fetchone()[0]
        print(f"✅ Đã insert sản phẩm {p.get('name')} (ID={product_id})")

cur.close()
conn.close()
print("🎉 Import vào Supabase thành công!")
