import requests
import json
import random
import string
import os

BASE_URL = "http://127.0.0.1:8000/api"

def generate_random_email(prefix="user"):
    return f"{prefix}_{''.join(random.choices(string.ascii_lowercase, k=5))}@example.com"

def create_dummy_file(filename="test_proof.png"):
    with open(filename, "wb") as f:
        f.write(os.urandom(1024))
    return filename

def run_verification():
    print("Starting Detailed Verification...")
    
    dummy_file = create_dummy_file()
    
    try:
        # ==========================================
        # 1. Register Client (with ID Proof)
        # ==========================================
        client_email = generate_random_email("client")
        client_password = "password123"
        print(f"\n[1] Registering Client: {client_email}")

        client_data = {
            "email": client_email,
            "password": client_password,
            "full_name": "Test Client",
            "phone_number": "1234567890",
            "address": "123 Test St",
            "city": "Test City",
        }
        
        # Test file upload
        files = {
            "id_proof": (dummy_file, open(dummy_file, "rb"), "image/png")
        }

        resp = requests.post(f"{BASE_URL}/register/client/", data=client_data, files=files)
        
        if resp.status_code == 201:
            print("  SUCCESS: Client registered with ID proof.")
        else:
            print(f"  FAILED: {resp.status_code} - {resp.text}")
            return

        # ==========================================
        # 2. Register Vendor (Multipart, No Scrape Types)
        # ==========================================
        vendor_email = generate_random_email("vendor")
        print(f"\n[2] Registering Vendor: {vendor_email}")
        
        vendor_data = {
            "email": vendor_email,
            "password": "password123",
            "full_name": "Test Vendor",
            "phone_number": "9876543210",
            "address": "Vendor Address",
            "city": "Mumbai",
            "business_name": "Scrap Kings",
            "business_type": "Sole Proprietorship",
            "operating_areas": "Mumbai, Thane",
            # "scrape_types": [] # Intentional omission to test Optional field
        }
        
        vendor_files = {
            "business_license": (dummy_file, open(dummy_file, "rb"), "image/png"),
            "gst_certificate": (dummy_file, open(dummy_file, "rb"), "image/png"),
            "address_proof": (dummy_file, open(dummy_file, "rb"), "image/png"),
            "id_proof": (dummy_file, open(dummy_file, "rb"), "image/png"),
        }
        
        resp = requests.post(f"{BASE_URL}/register/seller/", data=vendor_data, files=vendor_files)
        
        if resp.status_code == 201:
             print("  SUCCESS: Vendor registered (multipart) without scrape_types.")
        else:
             print(f"  FAILED: {resp.status_code} - {resp.text}")
             return

        # ==========================================
        # 3. Login Client
        # ==========================================
        print("\n[3] Logging in (Client)...")
        login_payload = {"email": client_email, "password": client_password}
        resp = requests.post(f"{BASE_URL}/login/", json=login_payload)
        
        if resp.status_code == 200:
            data = resp.json()
            access_token = data.get("access")
            print("  SUCCESS: Logged in.")
        else:
             print(f"  FAILED: {resp.status_code} - {resp.text}")
             return

        headers = {"Authorization": f"Bearer {access_token}"}

        # ==========================================
        # 4. OTP Flow (Generic)
        # ==========================================
        print(f"\n[4] Testing Email OTP...")
        otp_payload = {"contact": client_email, "channel": "email"}
        resp = requests.post(f"{BASE_URL}/otp/send/", json=otp_payload)
        
        otp = None
        if resp.status_code == 200:
            otp = resp.json().get("mock_otp")
            print(f"  SUCCESS: Email OTP Sent: {otp}")
            
            # Verify
            v_resp = requests.post(f"{BASE_URL}/otp/verify/", json={"contact": client_email, "otp": otp})
            if v_resp.status_code == 200:
                print("  SUCCESS: Email OTP Verified.")
            else:
                 print(f"  FAILED Verification: {v_resp.status_code}")
        else:
             print(f"  FAILED Sending: {resp.status_code}")

    except Exception as e:
        print(f"  ERROR: {e}")
    finally:
        # Cleanup
        if os.path.exists(dummy_file):
            os.remove(dummy_file)

if __name__ == "__main__":
    run_verification()
