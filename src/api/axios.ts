import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ==========================================
// MOCK DATA GENERATOR
// ==========================================
const getMockResponse = (url, data) => {
  console.warn(`⚠️ BACKEND OFFLINE: Generating Mock Response for ${url}`);

  if (url.includes("/login/") || url.includes("/register/")) {
    const isSeller = url.includes("seller");
    return {
      status: 200,
      data: {
        access: "mock_access_token_12345",
        refresh: "mock_refresh_token_67890",
        message: "Login Successful (Mock)",
        user: {
          id: 999,
          email: data?.email || "mock@example.com",
          full_name: data?.full_name || "Mock User",
          is_client: !isSeller,
          is_seller: isSeller,
          is_verified: true
        }
      }
    };
  }

  if (url.includes("/otp/send/")) {
    return {
      status: 200,
      data: {
        message: "OTP sent successfully (Mock)",
        mock_otp: "123456"
      }
    };
  }

  if (url.includes("/otp/verify/")) {
    return {
      status: 200,
      data: {
        message: "OTP Verified (Mock)"
      }
    };
  }

  if (url.includes("/pickup/create/")) {
    return {
      status: 201,
      data: {
        message: "Pickup request initiated (Mock).",
        request_id: 888,
        status: "pending"
      }
    };
  }

  return null;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // HANDLE NETWORK ERRORS (Backend Down)
    if (error.code === "ERR_NETWORK" || !error.response) {
      const mockRes = getMockResponse(originalRequest.url, JSON.parse(originalRequest.data || "{}"));
      if (mockRes) {
        return Promise.resolve(mockRes);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        // Use standard axios for refresh to avoid infinite loop if this api instance is used
        const response = await axios.post(
          "http://127.0.0.1:8000/api/token/refresh/",
          {
            refresh: refreshToken,
          },
        );

        const { access, refresh } = response.data;

        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails in mock mode, maybe just let it go? 
        // For now, if refresh endpoint also fails with network error, standard axios will throw.
        // We could mock refresh too if critical, but usually login is enough.
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
