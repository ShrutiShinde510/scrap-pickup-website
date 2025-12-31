# API Documentation

Base URL: `http://127.0.0.1:8000/api`

**Note**: In development mode (`DEBUG=True`), endpoints returning an OTP will include a `mock_otp` field in the JSON response for easier testing.

## Generic OTP Services

Used for verifying contacts during registration or other flows.

### 1. Send OTP
**Endpoint**: `POST /otp/send/`

Sends a 6-digit OTP to the specified contact via the requested channel.

```bash
curl -X POST http://127.0.0.1:8000/api/otp/send/ \
-H "Content-Type: application/json" \
-d '{
    "contact": "user@example.com",
    "channel": "email" 
}'
```
*   `channel`: "email" or "sms" (defaults to "email").

**Response**:
```json
{
    "message": "OTP sent successfully",
    "mock_otp": "123456" 
}
```

### 2. Verify OTP
**Endpoint**: `POST /otp/verify/`

Verifies the OTP sent to the contact.

```bash
curl -X POST http://127.0.0.1:8000/api/otp/verify/ \
-H "Content-Type: application/json" \
-d '{
    "contact": "user@example.com",
    "otp": "123456"
}'
```

**Response**:
```json
{
    "message": "OTP Verified"
}
```

---

## Authentication

### 1. Register Client
**Endpoint**: `POST /register/client/`

```bash
curl -X POST http://127.0.0.1:8000/api/register/client/ \
-H "Content-Type: application/json" \
-d '{
    "email": "client@example.com",
    "password": "strongpassword",
    "full_name": "Client Name",
    "phone_number": "1234567890",
    "address": "123 Main St",
    "city": "New York"
}'
```

### 2. Register Seller
**Endpoint**: `POST /register/seller/`

Supports `multipart/form-data` for document uploads.

```bash
curl -X POST http://127.0.0.1:8000/api/register/seller/ \
-H "Content-Type: multipart/form-data" \
-F "email=seller@example.com" \
-F "password=strongpassword" \
-F "full_name=Seller Name" \
-F "phone_number=0987654321" \
-F "business_name=Scrap Co" \
-F "business_type=Recycler" \
-F "scrape_types=PAPER" \
-F "scrape_types=PLASTIC" \

-F "vendor_id_proof=@/path/to/id_proof.jpg" \
-F "business_license=@/path/to/license.pdf"
```

> **Dual Role Support**: If you register with an email that already exists (e.g., a Client registering as a Seller), providing the **correct existing password** will link the new role to the existing account instead of creating a new user.

### 3. Login
**Endpoint**: `POST /login/`

```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
-H "Content-Type: application/json" \
-d '{
    "email": "client@example.com",
    "password": "strongpassword"
}'
```

**Response**:
```json
{
  "message": "...",
  "user": { ... },
  "access": "<ACCESS_TOKEN>",
  "refresh": "<REFRESH_TOKEN>"
}
```

---

## Pickup Request Flow

**Note**: All pickup endpoints require `Authorization: Bearer <ACCESS_TOKEN>` header.

### 1. Create Pickup Request
**Endpoint**: `POST /pickup/create/`
**Content-Type**: `multipart/form-data` (to support image upload)

```bash
curl -X POST http://127.0.0.1:8000/api/pickup/create/ \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-F "address=789 Pickup Lane" \
-F "latitude=40.7128" \
-F "longitude=-74.0060" \
-F "date=2025-01-15" \
-F "time_slot=09:00 AM - 11:00 AM" \
-F "scrape_image=@/path/to/image.jpg"
```

**Response**:
```json
{
    "message": "Pickup request initiated.",
    "request_id": 10,
    "status": "pending"
}
```

### 2. Add Contact Info & Send OTP
**Endpoint**: `POST /pickup/contact/`

Updates contact info for the request and **automatically triggers an SMS OTP** to the provided phone number.

```bash
curl -X POST http://127.0.0.1:8000/api/pickup/contact/ \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-F "request_id=10" \
-F "contact_name=John Doe" \
-F "contact_phone=5550001111"
```

**Response**:
```json
{
    "message": "Contact info updated. OTP sent.",
    "request_id": 10,
    "mock_otp": "123456"
}
```

### 3. Verify OTP (Pickup Specific)
**Endpoint**: `POST /pickup/verify-otp/`

Verifies the OTP associated with a specific pickup request.

```bash
curl -X POST http://127.0.0.1:8000/api/pickup/verify-otp/ \
-H "Content-Type: application/json" \
-d '{
    "request_id": 10,
    "otp": "123456"
}'
```

**Response**:
```json
{
    "message": "Phone verified. Pickup confirmed."
}
```
