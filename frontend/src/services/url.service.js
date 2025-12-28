import axios from 'axios'

const apiUrl=`${process.env.REACT_APP_API_URL}/api`;

const getToken=()=>localStorage.getItem("auth_token")

const axiosInstance= axios.create({
    baseURL:apiUrl,
    withCredentials:true,
    timeout: 20000,
})

axiosInstance.interceptors.request.use((config)=>{
        const token=getToken();
        if(token){
                config.headers.Authorization=`Bearer ${token}`
        }
        // Basic diagnostics in dev
        if (process.env.NODE_ENV !== 'production') {
            console.log('[axios] request:', {
                url: `${config.baseURL}${config.url}`,
                method: config.method,
            });
        }
        return config;
})

export default axiosInstance;