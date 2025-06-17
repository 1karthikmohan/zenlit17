import React from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, XMarkIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
  isRequesting: boolean;
  error?: string;
}

export const LocationPermissionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRequestLocation,
  isRequesting,
  error
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Enable Dynamic Location</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 active:scale-95 transition-all"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center relative">
              <MapPinIcon className="w-8 h-8 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <ArrowPathIcon className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-white">
              Find People Near You - Live!
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Enable location tracking to see people nearby in real-time. As you move around, the radar will automatically update to show new people in your area.
            </p>
          </div>

          {/* Dynamic Features */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-blue-300">Dynamic Features:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300">Live location tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <ArrowPathIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Auto-updates as you move</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Real-time distance calculations</span>
              </div>
            </div>
          </div>

          {/* Privacy Features */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Privacy & Security:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-300">Your exact location is never shared</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-300">Only approximate distances are shown</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-300">You can disable tracking anytime</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={onRequestLocation}
              disabled={isRequesting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRequesting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPinIcon className="w-5 h-5" />
                  Enable Live Tracking
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 active:scale-95 transition-all"
            >
              Maybe Later
            </button>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-500 text-center">
            Location tracking helps you discover people as you move around. You can change these permissions in your browser settings at any time.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};