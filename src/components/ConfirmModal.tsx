'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    isLoading = false,
}: ConfirmModalProps) {
    const handleConfirm = () => {
        onConfirm();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleBackdropClick}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="relative w-full max-w-md bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden"
                    >
                        {/* Close Button */}
                        {!isLoading && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                            >
                                <FiX size={20} />
                            </button>
                        )}

                        <div className="p-6">
                            {/* Icon */}
                            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-900/20' : 'bg-blue-900/20'
                                }`}>
                                <FiAlertTriangle className={isDanger ? 'text-red-400' : 'text-blue-400'} size={24} />
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-white text-center mb-2">
                                {title}
                            </h3>

                            {/* Message */}
                            <p className="text-gray-400 text-center mb-6">
                                {message}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isDanger
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-accent-blue hover:bg-blue-600'
                                        }`}
                                >
                                    {isLoading ? 'Processing...' : confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
