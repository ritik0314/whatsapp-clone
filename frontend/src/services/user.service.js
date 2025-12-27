import axiosInstance from "./url.service";

// Helper function to normalize error handling
const handleError = (error) => {
  if (error?.response?.data) return error.response.data;
  if (error?.response) return { status: "error", message: error.response.statusText };
  return { status: "error", message: error.message || "Something went wrong" };
};

export const sendOtp = async (phoneNumber, phoneSuffix, email) => {
  try {
    const response = await axiosInstance.post("/auth/send-otp", {
      phoneNumber,
      phoneSuffix,
      email,
    });
    return response.data;
  } catch (error) {
   throw handleError(error);
  }
};

export const verifyOtp = async (phoneNumber, phoneSuffix, otp, email) => {
  try {
    const response = await axiosInstance.post("/auth/verify-otp", {
      phoneNumber,
      phoneSuffix,
      otp,
      email,
    });
    return response.data;
  } catch (error) {
     throw handleError(error);
  }
};

export const updateUserProfile = async (updateData) => {
  try {
    const isFormData = typeof FormData !== 'undefined' && updateData instanceof FormData;
    const response = await axiosInstance.put(
      "/auth/update-profile",
      updateData,
      isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined
    );
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const checkUserAuth = async () => {
  try {
    const response = await axiosInstance.get("/auth/check-auth");

    if (response.data.status === "success") {
      return {
        isAuthenticated: true,
        user: response?.data?.data,
      }
    }else if(response.data.status === "error"){
      return { isAuthenticated: false}
    }

  return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const logoutUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/auth/users");
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};
