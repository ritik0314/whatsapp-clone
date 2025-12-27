import React from "react";
import formatTimestamp from "../../utils/formatTime";

const StatusList = ({ contact, onPreview, theme }) => {
  if (!contact || !Array.isArray(contact.statuses) || contact.statuses.length === 0) {
    return null;
  }

  const lastStatus = contact.statuses[contact.statuses.length - 1];

  return (
    <div
      className={`flex items-center space-x-4 py-2 px-2 rounded cursor-pointer transition
        ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}
      onClick={onPreview}
    >
      {/* Avatar + ring */}
      <div className="relative w-14 h-14">
        <img
          src={contact.avatar}
          alt={contact.name}
          className="w-14 h-14 rounded-full object-cover"
        />

        {/* Status ring */}
        <svg
          className="absolute top-0 left-0 w-14 h-14"
          viewBox="0 0 100 100"
        >
          {contact.statuses.map((_, index) => {
            const circumference = 2 * Math.PI * 48;
            const segment = circumference / contact.statuses.length;
            const offset = index * segment;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="#25D366"
                strokeWidth="4"
                strokeDasharray={`${segment - 6} 6`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>
      </div>

      {/* Name + time */}
      <div className="flex flex-col">
        <p className="font-semibold">
          {contact.name}
        </p>
        <p
          className={`text-sm ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {formatTimestamp(lastStatus.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default StatusList;

