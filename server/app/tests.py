
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class RegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
            "phone_number": "1234567890",
            "address": "123 Test St",
            "city": "Test City",
        }
        self.id_proof = SimpleUploadedFile("id_proof.jpg", b"file_content", content_type="image/jpeg")

    def test_client_registration(self):
        """Test standard client registration."""
        data = self.user_data.copy()
        data["id_proof"] = self.id_proof
        response = self.client.post("/api/register/client/", data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=self.user_data["email"]).exists())
        user = User.objects.get(email=self.user_data["email"])
        self.assertTrue(user.is_client)
        self.assertFalse(user.is_seller)

    def test_seller_registration(self):
        """Test standard seller registration with vendor_id_proof."""
        data = self.user_data.copy()
        # Seller specific fields
        data.update({
             "email": "seller@example.com",
             "business_name": "Test Biz",
             "business_type": "Other",
             "operating_areas": "Mumbai",
             "scrape_types": ["Plastic"],
             "vendor_id_proof": self.id_proof # key is vendor_id_proof
        })
        response = self.client.post("/api/register/seller/", data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="seller@example.com")
        self.assertTrue(user.is_seller)
        self.assertFalse(user.is_client)
        self.assertTrue(bool(user.vendor_id_proof)) # Check file exists

    def test_dual_role_registration(self):
        """Test registering as Client then adding Seller role to same account."""
        # 1. Register as Client
        self.test_client_registration()
        
        # 2. Register as Seller with SAME credentials
        data = self.user_data.copy()
        data.update({
             "business_name": "Dual Biz",
             "business_type": "Other",
             "operating_areas": "Pune",
             "vendor_id_proof": self.id_proof
        })
        response = self.client.post("/api/register/seller/", data, format='multipart')
        
        # Should be 201 Created (success)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(email=self.user_data["email"])
        self.assertTrue(user.is_client)
        self.assertTrue(user.is_seller)
        self.assertEqual(user.business_name, "Dual Biz")
        self.assertTrue(bool(user.vendor_id_proof))

    def test_dual_role_wrong_password(self):
        """Test failure when existing user tries to add role with wrong password."""
        # 1. Register as Client
        self.test_client_registration()
        
        # 2. Try Register Seller with wrong password
        data = self.user_data.copy()
        data["password"] = "wrongpassword"
        
        response = self.client.post("/api/register/seller/", data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
