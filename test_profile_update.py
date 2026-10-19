import urllib.request
import urllib.error
import json

try:
    # 1. Login
    req1 = urllib.request.Request('http://localhost:8000/api/auth/login', data=json.dumps({'email': 'ananya@gmail.com', 'password': 'password'}).encode(), headers={'Content-Type': 'application/json'})
    res1 = urllib.request.urlopen(req1)
    token = json.loads(res1.read())['token']
    print('Got token')

    # 2. Get Profile
    req2 = urllib.request.Request('http://localhost:8000/api/clients/profile', headers={'Authorization': 'Bearer ' + token})
    res2 = urllib.request.urlopen(req2)
    profile = json.loads(res2.read())
    print('Got profile')

    # 3. Add bank account
    profile['bank_accounts'].append({
        'bank_name': 'bank of baroda',
        'account_number': '123456789012',
        'ifsc_code': 'BARBOTEST01',
        'account_type': 'Savings',
        'balance': 50000
    })

    # 4. PUT Profile
    req3 = urllib.request.Request('http://localhost:8000/api/clients/profile', data=json.dumps(profile).encode(), headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}, method='PUT')
    res3 = urllib.request.urlopen(req3)
    print('Success:', res3.read().decode())
    
except urllib.error.HTTPError as e:
    print('Error Status:', e.code)
    print('Error Body:', e.read().decode())
