import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ClientRegistrationModal = ({ onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new Signup Page which has OTP verification
    if (onClose) onClose();
    navigate("/signup");
  }, [navigate, onClose]);

  return null;
};

export default ClientRegistrationModal;
