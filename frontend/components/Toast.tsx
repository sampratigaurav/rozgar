"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const CONFIGS = {
  success: {
    icon: "✓",
    bg: "bg-white",
    accent: "bg-green-500",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    text: "text-gray-800",
    bar: "bg-green-500",
  },
  error: {
    icon: "✕",
    bg: "bg-white",
    accent: "bg-red-500",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    text: "text-gray-800",
    bar: "bg-red-500",
  },
  info: {
    icon: "i",
    bg: "bg-white",
    accent: "bg-blue-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    text: "text-gray-800",
    bar: "bg-blue-500",
  },
};

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [leaving, setLeaving] = useState(false);
  const cfg = CONFIGS[type];

  useEffect(() => {
    const leaving = setTimeout(() => setLeaving(true), duration - 300);
    const close   = setTimeout(onClose, duration);
    return () => { clearTimeout(leaving); clearTimeout(close); };
  }, [onClose, duration]);

  return (
    <div
      className="fixed top-4 left-4 right-4 z-[100] max-w-lg mx-auto"
      style={{ animation: leaving ? 'toastOut 0.3s ease-in forwards' : 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      <div className={`${cfg.bg} rounded-2xl shadow-xl border border-gray-100 overflow-hidden`}
           style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}>
        {/* Content row */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Icon */}
          <div className={`w-8 h-8 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
            <span className={`${cfg.iconColor} text-sm font-black`}>{cfg.icon}</span>
          </div>

          {/* Message */}
          <p className={`${cfg.text} text-sm font-medium flex-1 leading-snug`}>{message}</p>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-sm font-bold flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100 overflow-hidden">
          <div
            className={`h-full ${cfg.bar} rounded-full`}
            style={{
              width: "100%",
              animation: `toastProgress ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
