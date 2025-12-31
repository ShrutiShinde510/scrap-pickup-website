from twilio.rest import Client
import os
import random

class OTPService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
        
        self.client = None
        if self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                print(f"Twilio Client Init Error: {e}")

    def send_otp(self, contact, channel='sms'):
        """
        Sends an OTP using Twilio Verify.
        """
        if not self.client or not self.verify_sid:
            print("Twilio Verify not configured.")
            return None

        try:
            # Twilio requires E.164 format for phones. 
            # If channel is 'sms' and no '+', assume +91 for India or default.
            to_contact = contact
            if channel == 'sms' and not contact.startswith('+'):
                to_contact = f"+91{contact}" 

            verification = self.client.verify.v2.services(self.verify_sid).verifications.create(
                to=to_contact,
                channel=channel
            )
            print(f"Twilio Verify Sent: {verification.status}")
            return verification.status
        except Exception as e:
            print(f"Twilio Verify Send Error: {e}")
            return None

    def verify_otp(self, contact, otp):
        """
        Verifies OTP using Twilio Verify.
        """
        if not self.client or not self.verify_sid:
            print("Twilio Verify not configured.")
            return False

        try:
            # Ensure consistent contact format
            to_contact = contact
            # Simple heuristic: if it looks like a phone number (digits) and no @, treat as SMS/Phone
            if '@' not in contact and not contact.startswith('+'):
                to_contact = f"+91{contact}"

            verification_check = self.client.verify.v2.services(self.verify_sid).verification_checks.create(
                to=to_contact,
                code=otp
            )
            print(f"Twilio Verify Check: {verification_check.status}")
            return verification_check.status == 'approved'
        except Exception as e:
            print(f"Twilio Verify Check Error: {e}")
            return False
