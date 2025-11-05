import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Admin kullanıcı bilgileri
    admin_username = "admin"
    admin_password = "admin123"
    
    # Önce var mı kontrol et
    existing_admin = await db.users.find_one({"username": admin_username})
    
    if existing_admin:
        print(f"⚠️  Admin kullanıcı zaten mevcut!")
        print(f"Kullanıcı Adı: {admin_username}")
        print(f"Şifre: (mevcut şifre korundu)")
        return
    
    # Hash şifreyi oluştur
    hashed_password = pwd_context.hash(admin_password)
    
    # Admin kullanıcıyı oluştur
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": admin_username,
        "password": hashed_password,
        "email": "admin@karamansaglik.com",
        "role": "yönetici"
    }
    
    await db.users.insert_one(admin_user)
    
    print("✅ Admin kullanıcı başarıyla oluşturuldu!")
    print(f"Kullanıcı Adı: {admin_username}")
    print(f"Şifre: {admin_password}")
    print(f"Rol: yönetici")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
