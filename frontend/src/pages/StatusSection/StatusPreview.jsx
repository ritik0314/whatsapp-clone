import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

const StatusPreview = ({
  contact,
  currentIndex,
  onPrev,
  onNext,
  onClose,
  onDelete,
  theme,
  loading,
  currentUser,
}) => {
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);

  const currentStatus = contact?.statuses?.[currentIndex];
  const isOwnerStatus = (contact?.id || contact?._id) === currentUser?._id;

  /* ---------- AUTO PROGRESS ---------- */
  useEffect(() => {
    if (!currentStatus) return;

    setProgress(0);
    let current = 0;

    const interval = setInterval(() => {
      current += 2; // 5 seconds total
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        onNext?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, currentStatus, onNext]);

  if (!currentStatus) return null;

  const handleDeleteStatus = async () => {
    const targetId = currentStatus?.id || currentStatus?._id;
    if (onDelete && targetId) {
      try {
        await onDelete(targetId);
      } catch (e) {
        // swallow; error surface handled by parent store error state
      }
    }

    if (contact.statuses.length === 1) {
      onClose?.();
    } else {
      onPrev?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      style={{ backdropFilter: "blur(5px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-4xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-full h-full relative ${
            theme === "dark" ? "bg-[#202c33]" : "bg-gray-800"
          }`}
        >
          {/* PROGRESS BARS */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-4 z-10">
            {contact.statuses.map((_, index) => (
              <div
                key={index}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width:
                      index < currentIndex
                        ? "100%"
                        : index === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* HEADER */}
          <div className="absolute top-8 left-4 right-16 z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
              <div>
                <p className="text-white font-semibold">
                  {contact.name}
                </p>
                <p className="text-gray-300 text-sm">
                  {formatTimestamp(currentStatus.timestamp)}
                </p>
              </div>
            </div>

            {isOwnerStatus && (
              <button
                onClick={handleDeleteStatus}
                className="text-white bg-red-500/70 rounded-full p-2 hover:bg-red-500"
              >
                <FaTrash />
              </button>
            )}
          </div>

          {/* CONTENT */}
          <div className="w-full h-full flex items-center justify-center">
            {currentStatus.contentType === "text" && (
              <p className="text-white text-2xl p-8 text-center">
                {currentStatus.media}
              </p>
            )}

            {currentStatus.contentType === "image" && (
              <img
                src={currentStatus.media}
                alt="status"
                className="max-w-full max-h-full object-contain"
              />
            )}

            {currentStatus.contentType === "video" && (
              <video
                src={currentStatus.media}
                autoPlay
                muted
                controls
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* CLOSE */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70"
          >
            <FaTimes />
          </button>

          {/* PREV */}
          {currentIndex > 0 && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-black/70"
            >
              <FaChevronLeft />
            </button>
          )}

          {/* NEXT */}
          {currentIndex < contact.statuses.length - 1 && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-black/70"
            >
              <FaChevronRight />
            </button>
          )}

          {/* VIEWERS */}
          {isOwnerStatus && (
            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={() => setShowViewers((p) => !p)}
                className="flex items-center justify-between w-full bg-black/50 text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-all"
              >
                <div className="flex items-center gap-2">
                  <FaEye />
                  <span>{currentStatus?.viewers?.length || 0}</span>
                </div>
                <FaChevronDown
                  className={`transition-transform ${
                    showViewers ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showViewers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 bg-black/70 rounded-lg p-4 max-h-40 overflow-y-auto"
                  >
                    {loading ? (
                      <p className="text-white text-center">
                        Loading viewers…
                      </p>
                    ) : currentStatus?.viewers?.length > 0 ? (
                      currentStatus.viewers.map((viewer) => (
                        <div
                          key={viewer._id}
                          className="flex items-center gap-3 mb-2"
                        >
                          <img
                            src={viewer.profilePicture}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-white">
                            {viewer.username}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-white text-center">
                        No viewers yet
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatusPreview;

