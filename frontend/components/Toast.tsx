"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bg =
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-800";

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 ${bg} text-white rounded-xl px-4 py-3 shadow-lg flex items-start gap-3 max-w-lg mx-auto`}
    >
      <span className="text-lg leading-none mt-0.5">
        {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
      </span>
      <p className="flex-1 text-sm leading-snug">{message}</p>
      <button onClick={onClose} className="text-white opacity-75 hover:opacity-100 text-lg leading-none">
        ×
      </button>
    </div>
  );
}
