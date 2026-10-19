import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/assetflow")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "assetflow")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

def get_db():
    return db
