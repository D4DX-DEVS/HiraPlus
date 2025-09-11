import React, { useState } from 'react';

const LeadersDeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Delete", 
  message = "Are you sure you want to delete this item?",
  itemName = "",
  confirmText = "Delete",
  cancelText = "Cancel"
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      setShowSuccess(true);
      // Auto close after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setIsDeleting(false);
        onClose();
      }, 2000);
    } catch (error) {
      setIsDeleting(false);
      // Handle error if needed
    }
  };

  const handleClose = () => {
    if (!isDeleting && !showSuccess) {
      setShowSuccess(false);
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50">
        {/* Header with Sidebar Color */}
        <div className="bg-[#080325] text-white px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              {showSuccess ? 'Success!' : title}
            </h2>
            {!isDeleting && !showSuccess && (
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-6">
          {showSuccess ? (
            /* Success State */
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-gray-900 mb-2">Deleted Successfully!</p>
                {itemName && (
                  <p className="text-sm text-gray-600">"{itemName}" has been deleted.</p>
                )}
              </div>
            </>
          ) : isDeleting ? (
            /* Loading State */
            <>
              <div className="w-16 h-16 bg-[#080325]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#080325]"></div>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-gray-900 mb-2">Deleting...</p>
                <p className="text-sm text-gray-600">Please wait while we delete the item.</p>
              </div>
            </>
          ) : (
            /* Confirm State */
            <>
              {/* Warning Icon */}
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-gray-700 mb-2">{message}</p>
                {itemName && (
                  <p className="text-sm text-gray-500 font-medium">"{itemName}"</p>
                )}
                <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium"
                >
                  {confirmText}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  {cancelText}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadersDeleteConfirmModal;
