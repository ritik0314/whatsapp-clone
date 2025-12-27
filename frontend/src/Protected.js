// import {useEffect, useState} from "react";
// import {Navigate, Outlet, useLocation} from "react-router-dom"
// import useUserStore from "./store/useUserStore";
// import { checkUserAuth } from "./services/user.service";
// import Loader from "./utils/Loader";

// export const ProtectedRoute= ()=>{
//     const location =useLocation();
//     const[isChecking,setIsChecking]=useState(true);

//     const {isAuthenticated,setUser,clearUser}= useUserStore.getState();


//     useEffect(()=>{
//         const verifyAuth= async ()=>{
//             try {
//                 const result =await checkUserAuth();
//                 if(result?.isAuthenticated){
//                     setUser(result.user);
//                 }else{
//                     clearUser();
//                 }
//             } catch (error) {
//                 console.error(error);
//                 clearUser();
//             }finally{
//                 setIsChecking(false);
//             }
//         }
//         verifyAuth();
//     },[setUser,clearUser])

//     if(isChecking){
//         return <Loader/>
//     }
//     if(!isAuthenticated){
//         return <Navigate to="/user-login" state={{from:location}} replace/>
//     }

//     //user is auth  -render the protected route
//     return  <Outlet/>
// }

// export const PublicRoute= ()=>{
//     const isAuthenticated=useUserStore(state=>state.isAuthenticated);
//     if(isAuthenticated){
//         return <Navigate to='/' replace/>
//     }
//     return <Outlet/>
// }


import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useUserStore from "./store/useUserStore";
import useLoginStore from "./store/useLoginStore";
import { checkUserAuth } from "./services/user.service";
import Loader from "./utils/Loader";

export const ProtectedRoute = () => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  const { isAuthenticated, user: currentUser, setUser, clearUser } = useUserStore();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // If user is already authenticated in the store, skip the auth check
        // This prevents clearing the user immediately after login/registration
        if (isAuthenticated && currentUser) {
          console.log('User already authenticated in store, skipping auth check');
          setIsChecking(false);
          return;
        }

        console.log('Calling checkUserAuth API...');
        const result = await checkUserAuth();
        console.log('checkUserAuth result:', result);
        
        if (result?.isAuthenticated) {
          const user = result.user;
          console.log('User from API:', user);
          setUser(user);
        } else {
          console.log('Not authenticated, clearing user');
          clearUser();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        clearUser();
      } finally {
        setIsChecking(false);
      }
    };
    verifyAuth();
  }, [setUser, clearUser, isAuthenticated, currentUser]);

  if (isChecking) return <Loader />;

  if (!isAuthenticated)
    return <Navigate to="/user-login" state={{ from: location }} replace />;

  return <Outlet />;
};

export const PublicRoute = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const step = useLoginStore((state) => state.step);
  
  console.log('PublicRoute - isAuthenticated:', isAuthenticated, 'step:', step, 'user:', user);
  
  // If user is in the middle of registration (step 2 or 3), ALWAYS allow access
  // This takes priority over authentication status
  if (step === 2 || step === 3) {
    console.log('In registration flow - allowing access to login page');
    return <Outlet />;
  }
  
  // Only redirect if user is authenticated AND has complete profile
  if (isAuthenticated && user?.username && (user?.profilePicture || user?.profilePictureUrl)) {
    console.log('User fully authenticated with complete profile - redirecting to home');
    return <Navigate to="/home" replace />;
  }
  
  return <Outlet />;
};
