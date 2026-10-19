import json
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["AssetFlowDB"]
leases = list(db.rental.find({}, {"_id": 0}))

with open("d:\\Sem 4\\AssetFlow\\leases_dump.json", "w") as f:
    json.dump(leases, f, indent=2, default=str)
