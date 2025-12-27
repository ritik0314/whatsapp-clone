import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/user-login/login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ProtectedRoute, PublicRoute } from './Protected';
import UserDetails from './components/UserDetails';
import HomePage from './components/HomePage';
import Status from './pages/StatusSection/Status';
import Setting from './pages/SettingSection/Setting';

import useUserStore from './store/useUserStore';
import { disconnectSocket, initializeSocket } from './services/chat.service';
import useChatStore from './store/chatStore';

function App() {
  const user = useUserStore((state) => state.user);

  // destructure correctly
  const { setCurrentUser, initSocketListners, cleanup } = useChatStore();

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();

      if (socket) {
        setCurrentUser(user);
        initSocketListners();  // ❗ removed (socket) argument
      }
    }

    return () => {
      cleanup();
      disconnectSocket();
    };
  }, [user, setCurrentUser, initSocketListners, cleanup]);

  return (
    <>
      <ToastContainer position='top-right' autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path='/' element={<Login />} />
            <Route path='/user-login' element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path='/home' element={<HomePage />} />
            <Route path='/user-profile' element={<UserDetails />} />
            <Route path='/status' element={<Status />} />
            <Route path='/setting' element={<Setting />} />
          </Route>

        </Routes>
      </Router>
    </>
  );
}

export default App;

