
import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { motion } from "framer-motion";
import ChatList from "../pages/chatSection/ChatList";
import useLayoutStore from "../store/layoutStore";
import { getAllUsers as fetchAllUsers } from "../services/user.service.js";

const HomePage = () => {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact
  );

  const [allUsers, setAllUsers] = useState([]);

  const loadAllUsers = async () => {
    try {
      const result = await fetchAllUsers();
      if (result?.status === "success") {
        setAllUsers(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList
          contacts={allUsers}
          setSelectedContact={setSelectedContact}
        />
      </motion.div>
    </Layout>
  );
};

export default HomePage;
