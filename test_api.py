import urllib.request
import urllib.error
import json

try:
    req = urllib.request.Request("http://localhost:8000/api/assets/")
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    print("Error Status:", e.code)
    print("Error Body:", e.read().decode())
