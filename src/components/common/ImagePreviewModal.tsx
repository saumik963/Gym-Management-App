import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMemberPhoto } from '../../services/photoService';

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: {
    id?: string;
    memberId?: string;
    name?: string;
    photo?: string;
  } | null;
  /** Optional override URL (e.g. from local form preview or blob URL) */
  imageUrl?: string | null;
  /** Element to return focus to when modal closes */
  triggerElement?: HTMLElement | null;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  member,
  imageUrl,
  triggerElement,
}) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const memberId = member?.memberId;
  const dbId = member?.id;
  const memberName = member?.name || 'Member';
  const photoRef = member?.photo;

  // Load image whenever modal opens or target changes
  useEffect(() => {
    if (!isOpen) {
      setDisplayUrl(null);
      setIsLoading(false);
      setLoadError(false);
      return;
    }

    let isMounted = true;
    let localCreatedUrl: string | null = null;
    setIsLoading(true);
    setLoadError(false);

    async function fetchFullImage() {
      // 1. Direct preview URL passed as prop
      if (imageUrl) {
        if (isMounted) {
          setDisplayUrl(imageUrl);
          setIsLoading(false);
        }
        return;
      }

      // 2. Direct web URL or Base64 data URL
      if (
        photoRef &&
        (photoRef.startsWith('http://') ||
          photoRef.startsWith('https://') ||
          photoRef.startsWith('data:'))
      ) {
        if (isMounted) {
          setDisplayUrl(photoRef);
          setIsLoading(false);
        }
        return;
      }

      // 3. Retrieve original full-resolution Blob from IndexedDB
      if (dbId) {
        try {
          const record = await getMemberPhoto(dbId);
          if (record && record.blob && isMounted) {
            // Use original full-size record.blob
            localCreatedUrl = URL.createObjectURL(record.blob);
            setDisplayUrl(localCreatedUrl);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to retrieve full member photo from IndexedDB:', err);
        }
      }

      // 4. No photo stored
      if (isMounted) {
        setDisplayUrl(null);
        setIsLoading(false);
      }
    }

    fetchFullImage();

    return () => {
      isMounted = false;
      if (localCreatedUrl) {
        URL.revokeObjectURL(localCreatedUrl);
      }
    };
  }, [isOpen, dbId, photoRef, imageUrl]);

  // Handle ESC key, body scroll lock, and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on mount
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    // Escape listener using capture to handle nested modals correctly
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);

      // Restore focus to trigger element when closing
      if (triggerElement && typeof triggerElement.focus === 'function') {
        setTimeout(() => {
          triggerElement.focus();
        }, 10);
      }
    };
  }, [isOpen, onClose, triggerElement]);

  if (typeof document === 'undefined') return null;

  const initial = memberName ? memberName.charAt(0).toUpperCase() : '?';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Profile photo preview for ${memberName}`}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 select-none"
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Visible Top-Right Close Button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[10000] p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-md border border-white/10 shadow-lg focus:outline-hidden focus:ring-2 focus:ring-white"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Centered Modal Content (stops propagation so clicking inside image doesn't close) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-[10000] flex flex-col items-center justify-center max-w-[90vw] max-h-[85vh] cursor-default pointer-events-auto"
          >
            {/* Loading State */}
            {isLoading ? (
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col items-center justify-center text-white/70 space-y-3 shadow-2xl">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading full-size photo...</span>
              </div>
            ) : displayUrl && !loadError ? (
              /* Full-size Original Photo */
              <img
                src={displayUrl}
                alt={`Profile photo of ${memberName}`}
                onError={() => setLoadError(true)}
                className="max-w-[90vw] max-h-[75vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            ) : (
              /* Fallback when image is missing or failed */
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                <div className="w-24 h-24 rounded-full bg-emerald-600 text-white flex items-center justify-center text-4xl font-bold mb-4 shadow-inner">
                  {initial && initial !== '?' ? (
                    initial
                  ) : (
                    <User className="w-12 h-12 text-white/80" />
                  )}
                </div>
                <p className="text-white font-medium text-sm">
                  No profile photo uploaded
                </p>
                <p className="text-white/50 text-xs mt-1">
                  {memberName} is currently using the default avatar.
                </p>
              </div>
            )}

            {/* Member Details Caption beneath Image */}
            <div className="mt-3.5 text-center px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white max-w-[90vw] shadow-lg">
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-wide text-white drop-shadow-xs">
                  {memberName}
                </span>
                {memberId && (
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-white/10 text-emerald-300">
                    {memberId}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
