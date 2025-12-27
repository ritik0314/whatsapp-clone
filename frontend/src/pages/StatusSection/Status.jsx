import React, { useEffect, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useStatusStore from "../../store/useStatusStore";
import Layout from "../../components/Layout";
import StatusPreview from "./StatusPreview";
import StatusList from "./StatusList";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaCamera, FaEllipsisH, FaPlus } from "react-icons/fa";
import formatTimestamp from "../../utils/formatTime";

const Status = () => {
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showOption, setShowOption] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const {
    statuses,
    loading,
    error,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getUserStatuses,
    getOtherStatuses,
    clearError,
    initializeSocket,
    cleanupSocket,
  } = useStatusStore();

  const userStatuses = getUserStatuses(user?._id);
  const userOtherStatuses = getOtherStatuses(user?._id);

  /* ---------- INIT ---------- */
  useEffect(() => {
    fetchStatuses();
    initializeSocket();

    return () => {
      cleanupSocket();
      clearError();
    };
  }, [fetchStatuses, initializeSocket, cleanupSocket, clearError]);

  /* ---------- FILE ---------- */
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setFilePreview(URL.createObjectURL(file));
    }
  };

  /* ---------- CREATE ---------- */
  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return;

    await createStatus({ content: newStatus, file: selectedFile });

    setNewStatus("");
    setSelectedFile(null);
    setFilePreview(null);
    setShowCreateModal(false);
  };

  /* ---------- VIEW ---------- */
  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- DELETE ---------- */
  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOption(false);
      handlePreviewClose();
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- PREVIEW ---------- */
  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  const handlePreviewNext = () => {
    if (
      previewContact &&
      currentStatusIndex < previewContact.statuses.length - 1
    ) {
      setCurrentStatusIndex((prev) => prev + 1);
    } else {
      handlePreviewClose();
    }
  };

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleStatusPreview = (contact, index = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(index);

    if (contact?.statuses?.[index]) {
      handleViewStatus(contact.statuses[index].id || contact.statuses[index]._id);
    }
  };

  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            theme={theme}
            currentUser={user}
            loading={loading}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex-1 h-screen ${
          theme === "dark"
            ? "bg-[rgb(12,19,24)] text-white"
            : "bg-gray-100 text-black"
        }`}
      >
        {/* HEADER */}
        <div className="p-4 font-bold text-xl">Status</div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 mx-4 rounded relative">
            {error}
            <button
              onClick={clearError}
              className="absolute right-2 top-2"
            >
              <RxCross2 />
            </button>
          </div>
        )}

        {/* MY STATUS */}
        <div
          className="p-4 flex items-center gap-4 cursor-pointer"
          onClick={() =>
            userStatuses
              ? handleStatusPreview(userStatuses)
              : setShowCreateModal(true)
          }
        >
          <div className="relative w-12 h-12">
            <img
              src={user?.profilePicture}
              alt="My profile"
              className="w-12 h-12 rounded-full object-cover"
            />
            {!userStatuses && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] border border-white shadow"
                aria-label="Add status"
                title="Add status"
              >
                <FaPlus />
              </button>
            )}
          </div>
          <div>
            <p className="font-semibold">My Status</p>
            <p className="text-sm text-gray-400">
              {userStatuses
                ? `${userStatuses.statuses.length} status · ${formatTimestamp(
                    userStatuses.statuses.at(-1)?.timestamp
                  )}`
                : "Tap to add status update"}
            </p>
          </div>
          {userStatuses && (
            <div className="ml-auto relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOption((s) => !s);
                }}
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
                aria-haspopup="menu"
                aria-expanded={showOption}
                title="More options"
              >
                <FaEllipsisH />
              </button>

              {showOption && (
                <div
                  className={`absolute right-0 mt-2 w-44 rounded-md shadow-lg z-20 ${
                    theme === "dark" ? "bg-[#202c33] text-white" : "bg-white"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                  role="menu"
                >
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-500"
                    onClick={() => {
                      setShowOption(false);
                      setShowCreateModal(true);
                    }}
                    role="menuitem"
                  >
                    Add new status
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-500"
                    onClick={() => {
                      setShowOption(false);
                      handleStatusPreview(userStatuses);
                    }}
                    role="menuitem"
                  >
                    View my statuses
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close the options dropdown when clicking outside main area */}
        {showOption && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowOption(false)}
          />
        )}

        {/* CREATE MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className={`p-6 rounded-lg w-full max-w-md ${
                theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
              }`}
            >
              <h3 className="font-semibold mb-4">Create Status</h3>

              {filePreview && (
                <>
                  {selectedFile?.type.startsWith("video/") ? (
                    <video
                      src={filePreview}
                      controls
                      className="w-full rounded mb-4"
                    />
                  ) : (
                    <img
                      src={filePreview}
                      className="w-full rounded mb-4"
                    />
                  )}
                </>
              )}

              <textarea
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="What's on your mind?"
                className={`w-full p-3 border rounded mb-4 ${
                  theme === "dark"
                    ? "bg-[#0b141a] text-white border-gray-700"
                    : "bg-white text-black border-gray-300"
                }`}
              />

              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="mb-4"
              />

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button
                  onClick={handleCreateStatus}
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RECENT UPDATES */}
        <div className="px-4 mt-2">
          <p className="text-sm font-semibold mb-2 text-gray-500">
            Recent updates
          </p>
          <div className="space-y-2">
            {Array.isArray(userOtherStatuses) && userOtherStatuses.length > 0 ? (
              userOtherStatuses.map((contact) => (
                <StatusList
                  key={contact.id}
                  contact={contact}
                  theme={theme}
                  onPreview={() => handleStatusPreview(contact)}
                />
              ))
            ) : (
              <p className="text-sm text-gray-400">No recent updates</p>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Status;
