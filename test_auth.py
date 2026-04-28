import requests

BASE_URL = 'http://localhost:8000'

# 1. Test Registration
print("Testing Registration...")
reg_data = {
    'username': 'test_user_99',
    'email': 'test99@vpulse.pro',
    'password': 'Password123!',
    'password2': 'Password123!',
    'name': 'Test User 99'
}
r1 = requests.post(f"{BASE_URL}/api/auth/register/", json=reg_data)
print(r1.status_code, r1.text)

# 2. Test OAuth Login
print("Testing OAuth Login...")
auth_data = {
    'grant_type': 'password',
    'username': 'test_user_99',
    'password': 'Password123!',
    'client_id': 'vpulse_frontend_client'
}
r2 = requests.post(f"{BASE_URL}/o/token/", data=auth_data)
print(r2.status_code, r2.text)

if r2.status_code == 200:
    token = r2.json().get('access_token')
    # 3. Test Profile Fetch
    print("Testing Profile Fetch...")
    headers = {'Authorization': f'Bearer {token}'}
    r3 = requests.get(f"{BASE_URL}/api/profile/me/", headers=headers)
    print(r3.status_code, r3.text)

