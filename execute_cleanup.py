import os
import shutil
from pymongo import MongoClient

def main():
    # 1. Delete unwanted files
    print("--- File Cleanup ---")
    files_to_delete = [
        r"d:\Sem 4\AssetFlow\backend\django_error.log",
        r"d:\Sem 4\AssetFlow\backend\request_logs.txt",
        r"d:\Sem 4\AssetFlow\scanner.py",
        r"d:\Sem 4\AssetFlow\cleanup.py",
        r"d:\Sem 4\AssetFlow\check_tables.py"
    ]
    
    for f in files_to_delete:
        if os.path.exists(f):
            try:
                os.remove(f)
                print(f"Deleted file: {f}")
            except Exception as e:
                print(f"Failed to delete {f}: {e}")
                
    # Delete __pycache__ in backend
    backend_dir = r"d:\Sem 4\AssetFlow\backend"
    for dirpath, dirnames, filenames in os.walk(backend_dir):
        if "__pycache__" in dirnames:
            pycache_path = os.path.join(dirpath, "__pycache__")
            try:
                shutil.rmtree(pycache_path)
                print(f"Deleted directory: {pycache_path}")
            except Exception as e:
                print(f"Failed to delete {pycache_path}: {e}")

    # 2. Delete specific MongoDB collections
    print("\n--- MongoDB Collections Cleanup ---")
    try:
        client = MongoClient("mongodb://localhost:27017/assetflow")
        db = client["assetflow"]
        
        collections_to_delete = ["tasks", "audit_logs"]
        
        for c in collections_to_delete:
            db.drop_collection(c)
            print(f"Dropped collection: {c}")
            
        print("\nCleanup completed successfully!")
            
    except Exception as e:
        print(f"MongoDB connection/query failed: {e}")

if __name__ == '__main__':
    main()
