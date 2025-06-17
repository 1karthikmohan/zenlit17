import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  user: User;
  onClose: () => void;
  onViewProfile: () => void;
}

export const UserProfileModal: React.FC<Props> = ({ user, onClose, onViewProfile }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <img
          src={user.dpUrl}
          alt={user.name}
          className="w-80 h-80 object-cover rounded-lg shadow-2xl"
        />
      </motion.div>
    </motion.div>
  );
};