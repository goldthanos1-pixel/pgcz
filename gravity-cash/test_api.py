import requests

def run_test():
    print("=== Start Integration API Test ===")
    session = requests.Session()
    
    # 1. Register test user
    payload = {"email": "test_agent@example.com", "password": "password123"}
    try:
        r_reg = session.post("http://localhost:5000/api/auth/register", json=payload)
        print(f"Register status: {r_reg.status_code}, Response: {r_reg.json()}")
    except Exception as e:
        print("Register failed (user may already exist):", e)
        
    # 2. Login
    r_login = session.post("http://localhost:5000/api/auth/login", json=payload)
    print(f"Login status: {r_login.status_code}")
    print(f"Cookies received: {session.cookies.get_dict()}")
    
    # 3. Access Protected Route (Fetch)
    r_data = session.get("http://localhost:5000/api/data")
    print(f"Get Data Status: {r_data.status_code}")
    print(f"Current Records: {r_data.json()}")
    
    # 4. Create Record
    r_create = session.post("http://localhost:5000/api/data", json={"data": "Tapped 5 Coins - Test"})
    print(f"Create Record Status: {r_create.status_code}")
    print(f"Created Record: {r_create.json()}")
    
    # 5. Access Protected Route again to verify persistence
    r_data_after = session.get("http://localhost:5000/api/data")
    print(f"Verified Records List: {r_data_after.json()}")
    print("=== Integration API Test Completed Successfully ===")

if __name__ == "__main__":
    run_test()
