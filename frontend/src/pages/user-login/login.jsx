import React, { useState, useEffect } from 'react'
import useLoginStore from '../../store/useLoginStore'
import countries from '../../utils/countries';
import * as yup from 'yup';
import { yupResolver } from "@hookform/resolvers/yup"
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';
import useThemeStore from '../../store/themeStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from 'react-icons/fa';
import Spinner from '../../utils/Spinner';
// import from actual service file in your project
import { sendOtp, verifyOtp, updateUserProfile } from '../../services/user.service';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


//validation schema
const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup.string().nullable().notRequired().matches(/^\d+$/, "Phone number must be digits").transform((value, originalValue) =>
      originalValue.trim() === "" ? null : value
    ),
    email: yup.string().nullable().notRequired().email("please enter valid email").transform((value, originalValue) =>
      originalValue.trim() === "" ? null : value
    )
  }).test(
    "at-least-one",
    "Either email or phone number is required",
    function (value) {
      return !!(value?.phoneNumber || value?.email)
    }
  );

const otpValidationSchema = yup.object().shape({
  otp: yup.string().length(6, "otp must be exactly 6 digits").required("Otp is required")
});
const profileValidationSchema = yup.object().shape({
  username: yup.string().required("username is required"),
  agreed: yup.bool().oneOf([true], "You must agree to the terms")
})

const avatars = [
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]

const Login = () => {
  const { step, setStep, setUserPhoneData, setUserData, resetLoginState, userPhoneData, userData } = useLoginStore();
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
   const [phoneNumber,setPhoneNumber]=useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  // const [email,setEmail]=useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme } = useThemeStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false)

  // Log step changes
  useEffect(() => {
    console.log('=== Login Component - Step Changed ===');
    console.log('Current step:', step);
    console.log('userPhoneData:', userPhoneData);
    console.log('userData:', userData);
  }, [step, userPhoneData, userData]);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    getValues
  } = useForm({
    resolver: yupResolver(loginValidationSchema)
  })

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue
  } = useForm({
    resolver: yupResolver(otpValidationSchema)
  })

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch
  } = useForm({
    resolver: yupResolver(profileValidationSchema)
  })

  // fixed: return expression
  const filterCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  )

  const onLoginSubmit = async () => {
    try {
      setLoading(true);
      const { email, phoneNumber } = getValues();
      if (email) {
        const response = await sendOtp(null, null, email);
        if (response?.status === 'success') {
          toast.info("OTP is sent to your email");
          setUserPhoneData({ email });
          setStep(2)
        }
      } else {
        const response = await sendOtp(phoneNumber, selectedCountry.dialCode);
        if (response?.status === 'success') {
          toast.info("OTP is sent to your phone number");
          setUserPhoneData({ phoneNumber, phoneSuffix: selectedCountry.dialCode });
          setStep(2)
        }
      }
    } catch (error) {
      console.log(error);
      setError(error.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const onOTPSubmit = async () => {
    try {
      setLoading(true)
      setError("");
      if (!userPhoneData) {
        throw new Error("Phone or email data is missing")
      }
      const otpString = otp.join("")
      let response;
      if (userPhoneData?.email) {
        response = await verifyOtp(null, null, otpString, userPhoneData.email)
      } else {
        response = await verifyOtp(
          userPhoneData.phoneNumber,
          userPhoneData.phoneSuffix,
           otpString
          );
      }

      // DEBUG: inspect the full response shape
      console.log("verifyOtp response:", response)

      // normalize/accept common response shapes (api body or axios response)
     
      const body = response?.data ?? response
      console.log('verifyOtp body:', body)
     
      const success =
        body?.status === 'success' ||
        body?.success === true ||
        response?.status === 200 ||
        response?.status === 'success'

      if (!success) {
        setError("OTP verification failed")
        return
      }

      console.log('OTP verification successful!');
      const token=response.data?.token;
      localStorage.setItem("auth_token",token);
      // ALWAYS move to step 3 after successful OTP verification
      // User will complete their profile on step 3
      console.log('Moving to step 3 for profile setup')
      
      // Get user data and store it
      const user = body?.user ?? body?.data?.user ?? response?.data?.user
      console.log('verified user:', user)
      setUserData(user)
      
      console.log('Calling setStep(3)...')
      setStep(3)
      
      // Use setTimeout to verify state was updated
      setTimeout(() => {
        const currentState = useLoginStore.getState();
        console.log('Step after setStep(3):', currentState.step);
      }, 0);
      
      // Determine whether API explicitly indicates a complete profile
      const profileCompleteFlag =
        body?.profileComplete ?? body?.data?.profileComplete ?? body?.user?.profileComplete;

      const isProfileComplete = profileCompleteFlag === true;

      if (isProfileComplete) {
        // Returning user with a complete profile — set user and go home
        console.log('User has complete profile - navigating to home')
        setUser(user)
        toast.success("Welcome back to WhatsApp")
        resetLoginState()
        navigate('/home')
        return;
      }

      // Otherwise treat as new/incomplete profile: advance to profile step
      toast.success("OTP verified! Please complete your profile")
      setUserData(user)
      setStep(3)
    } catch (error) {
      console.log(error)
      setError(error?.message || "Failed to verify OTP")
    } finally {
      setLoading(false)
    }
  }

  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file))
    }
  }

  // accept data param
  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username)
      formData.append("agreed", data.agreed)
      if (profilePictureFile) {
        formData.append("media", profilePictureFile)
      } else {
        formData.append("profilePicture", selectedAvatar)
      }

      const result = await updateUserProfile(formData)
      
      console.log("updateUserProfile result:", result);
      
      // Backend returns: { status: 'success', message: '...', data: user }
      const updatedUser = result?.data
      
      console.log("Updated user:", updatedUser);
      
      if (!updatedUser) {
        throw new Error("Failed to get updated user data");
      }
      
      // Set the user in global store - this makes them authenticated
      setUser(updatedUser)
      console.log("User set in store, isAuthenticated should be true now");
      
      // Show success message
      toast.success("Profile created successfully!");
      
      // Reset login state
      resetLoginState();
      console.log("Login state reset");
      
      // Navigate to home with replace to prevent back navigation to login
      console.log("Navigating to /home");
      navigate('/home', { replace: true })
    } catch (error) {
      console.log("Profile update error:", error);
      setError(error.message || "Failed to update user profile")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue("otp", newOtp.join(""));
    if (value && index < otp.length - 1) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  }

  const ProgressBar = () => (
    <div className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}>
      <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}
      />
    </div>
  )

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError("")
  }

  return (
    <div className={`min-h-screen 
    ${theme === 'dark' 
    ? "bg-gray-900" 
    : "bg-gradient-to-br from-green-400 to-blue-500"} 
    flex items-center justify-center p-4 overflow-hidden`}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${theme === 'dark' 
           ? "bg-gray-800 text-white" 
           : "bg-white"}
            p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
          className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center "
        >
          <FaWhatsapp className='w-16 h-16 text-white' />

        </motion.div>
        <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          WhatsApp Login
        </h1>

        <ProgressBar />
        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

        {step === 1 && (
          <form className='space-y-4' onSubmit={handleLoginSubmit(onLoginSubmit)}>
            <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-4`}>
              Enter your phone number to receive an OTP
            </p>

            <div className='relative'>
              <div className='flex'>
                <div className='relative w-1/3'>
                  <button type="button" className={`flex-shrink inline-flex items-center py-2.5 px-4 text-sm font-medium text-center 
                  ${theme === 'dark' 
                    ? "text-white bg-gray-700 border-gray-600" 
                    : "text-gray-900 bg-gray-100 border-gray-300"} border rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100`}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <span>
                      {selectedCountry.flag} {selectedCountry.dialCode}
                    </span>
                    <FaChevronDown className='ml-2' />
                  </button>
                  {showDropdown && (
                    <div
                      className={`absolute z-10 w-full mt-1 ${theme === 'dark' ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border rounded-md shadow-lg max-h-60 overflow-auto`}
                    >
                      <div
                        className={`sticky top-0 ${theme === 'dark' ? "bg-gray-700" : "bg-white"} p-2`}
                      >
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py-1 border 
                            ${theme === 'dark'
                               ? "bg-gray-600 border-gray-500 text-white" 
                               : "bg-white border-gray-300"} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green`}
                        />
                      </div>
                      {filterCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          type="button"
                          className={`w-full text-left px-3 py-2
                             ${theme === 'dark'
                               ? "hover:bg-gray-600"
                                : "hover:bg-gray-100 "}`}
                          onClick={() => {
                            setSelectedCountry(country)
                            setShowDropdown(false)
                          }}
                        >
                          {country.flag} ({country.dialCode}) {country.name}
                        </button>
                      ))}
                    </div>

                  )}
                </div>
                <input
                  type="text"
                  {...loginRegister("phoneNumber")}
                   value={phoneNumber}
                   placeholder="Phone Number"
                  onChange={(e)=>setPhoneNumber(e.target.value)}
                  className={`w-2/3 px-4 py-2 border 
                    ${theme === 'dark'
                       ? "bg-gray-700 border-gray-600 text-white" 
                       : "bg-white border-gray-300"} rounded-md  focus:outline-none focus:ring-2 focus:ring-green 
                       ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
                />

              </div>
              {loginErrors.phoneNumber && (
                <p className="text-red-500 text-sm">{loginErrors.phoneNumber.message}</p>
              )}

            </div>

            {/* divider with or */}
            <div className="flex items-center my-4" >
              <div className="flex-grow h-px bg-gray-300" />
              <span className='mx-3 text-gray-500 text-sm font-medium '>or</span>
              <div className="flex-grow h-px bg-gray-300" />
            </div>
            {/* email input box */}
            <div className={`flex items-center border rounded-md px-3 py-2 
              ${theme === 'dark' 
              ? "bg-gray-700 border-gray-600" 
              : "bg-white border-gray-300"}`}>
              <FaUser className={`mr-2 text-gray-400 
                ${theme === 'dark' 
                ? "text-gray-400" 
                : "text-gray-500"}`} />
              <input
                type="email"
                {...loginRegister("email")}
                // value={email}
                placeholder="Email (optional)"
                className={`w-full bg-transparent focus:outline-none 
                  ${theme === 'dark'
                     ? "text-white" 
                     : "text-black"} 
                  ${loginErrors.email 
                    ? "border-red-500" 
                    : ""}`}
              />
            </div>
            {loginErrors.email && (
              <p className="text-red-500 text-sm">{loginErrors.email.message}</p>
            )}

            <button
              type="submit"
              className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition'>
              {loading ? <Spinner /> : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOTPSubmit)} className='space-y-4'>
            <p className={`text-center ${theme === 'dark' ? "text-gray-300" : "text-gray-600"} mb-4`}>
              Please enter the 6-digit OTP sent to your {userPhoneData?.phoneSuffix ? userPhoneData.phoneSuffix : "Email"}{" "}
              {userPhoneData?.phoneNumber && userPhoneData?.phoneNumber}
            </p>
            <div className='flex justify-between'>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type='text'
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className={`w-12 h-12 text-center border 
                                ${theme === 'dark' ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-500"}
                                rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 
                                ${otpErrors.otp ? "border-red-500" : ""}`}
                />
              ))}

            </div>
            {otpErrors.otp && (
              <p className="text-red-500 text-sm">
                {otpErrors.otp.message}</p>
            )}
            <button
              type="submit"
              className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition'>
              {loading ? <Spinner /> : "Verify OTP"}
            </button>

            <button
              type='button'
              onClick={handleBack}
              className={`w-full mt-2 
                        ${theme === 'dark' ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                         py-2 rounded-md hover:bg-gray-300 transition flex items-center justify-center`}
            >
              <FaArrowLeft className='mr-2' />
              Wrong number? Go Back
            </button>
          </form>
        )}

        {step===3 && (
            <form 
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className='space-y-4'>
                <div className='flex flex-col items-center mb-4'>
                    <div className='relative w-24 h-24 mb-2'>
                        <img
                        src={profilePicture|| selectedAvatar}
                        alt="profile"
                        className='w-full h-full rounded-full object-cover'
                        />
                        <label
                        htmlFor="profile-picture"
                        className='absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300'
                        >
                            <FaPlus className='w-4 h-4'/>
                        </label>
                        <input
                        type="file"
                        id="profile-picture"
                        accept='image/*'
                        onChange={handleFileChange}
                        className='hidden'
                        />

                    </div>
                    <p className={`text-sm 
                        ${theme==='dark'
                        ?"text-gray-300"
                        :"text-gray-500"}mb-2`}>
                        Choose an avatar
                    </p>
                    <div className="flex flex-row gap-2 justify-center items-center flex-nowrap overflow-x-auto">
                        {avatars.map((avatar,index)=>(
                            <img
                            key={index}
                            src={avatar}
                            alt={`Avatar ${index+1}`}
                            className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 
                                ${selectedAvatar===avatar?"ring-2 ring-green-500":""}`}
                                onClick={()=>setSelectedAvatar(avatar)}
                            />
                        ))}

                    </div>
                </div>
                <div className="relative">
                    <FaUser
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme==='dark'?"text-gray-400":"text-gray-400"}`}/>
                    <input
                    {...profileRegister("username")}
                    type="text"
                    placeholder="Username"
                    className={`w-full pl-10 pr-3 py-2 border ${theme==="dark"?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-300 "}rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg`}

                    />

                    {profileErrors.username && (
                        <p className='text-red-500 text-sm mt-1'>
                            {profileErrors.username.message}

                        </p>
                    )}
                </div>
                <div className='flex items-center space-x-2'>
                    <input
                        {...profileRegister('agreed')}
                        type="checkbox"
                        className={`rounded ${theme==='dark'?"text-green-500 bg-gray-700":"text-green-500"} focus:ring-green-500 `}
                    />
                    <label 
                    htmlFor='terms'
                    className={`text-sm ${theme==='dark'?"text-gray-300":"text-gray-700"}`}
                    >
                    I agree to the {" "}
                    <a href='#' className='text-red-500 hover:underline'>
                        Terms and Conditions
                    </a>
                    </label>
                    
                </div>
                {profileErrors.agreed && (
                        <p className='text-red-500 text-sm mt-1'>
                            {profileErrors.agreed.message}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={!watch("agreed") || loading}
                        className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg 
                          ${loading ?"opacity-50 cursor-not-allowed":""}
                          `}>
                        {loading ? <Spinner /> : "Finish Registration"}
                    </button>
            </form>
        )}

      </motion.div>
    </div>
  )
}

export default Login



