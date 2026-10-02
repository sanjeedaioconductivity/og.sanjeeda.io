import React from "react";

interface CustomAlertProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomAlert({ message, onConfirm, onCancel }: CustomAlertProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="w-full max-w-[260px] sm:max-w-sm rounded-lg shadow-md px-4 py-5 bg-white text-center animate-scaleIn">
        <p className="text-black font-semibold mb-3 text-sm">🚨 {message}</p>
        <p className="text-black text-xs mb-5">
          Do you want to continue with previous details?
        </p>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-green1 text-white py-2 rounded-full text-xs"
          >
            Use Previous
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-Red text-white py-2 rounded-full text-xs"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
