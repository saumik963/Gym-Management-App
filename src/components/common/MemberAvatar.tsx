import React, { useEffect, useState, useRef } from 'react';
import { getMemberPhoto } from '../../services/photoService';
import { User, ZoomIn } from 'lucide-react';
import { ImagePreviewModal } from './ImagePreviewModal';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface MemberAvatarProps {
  member?: {
    id?: string;
    memberId?: string;
    name?: string;
    photo?: string;
  } | null;
  size?: AvatarSize;
  rounded?: 'lg' | 'xl' | '2xl' | 'full';
  preferFull?: boolean;
  className?: string;
  alt?: string;
  /** Whether clicking the avatar enlarges the photo in a popup modal. Defaults to true. */
  allowPreview?: boolean;
  /** Optional click handler callback */
  onClick?: (e: React.MouseEvent) => void;
}

const SIZE_CLASSES: Record<AvatarSize, { container: string; text: string; icon: string }> = {
  xs: { container: 'w-7 h-7', text: 'text-[11px]', icon: 'w-3.5 h-3.5' },
  sm: { container: 'w-9 h-9', text: 'text-xs', icon: 'w-4 h-4' },
  md: { container: 'w-11 h-11', text: 'text-sm font-bold', icon: 'w-5 h-5' },
  lg: { container: 'w-16 h-16', text: 'text-xl font-bold', icon: 'w-7 h-7' },
  xl: { container: 'w-24 h-24', text: 'text-3xl font-bold', icon: 'w-10 h-10' },
};

const ROUNDED_CLASSES = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  member,
  size = 'md',
  rounded = 'xl',
  preferFull = false,
  className = '',
  alt,
  allowPreview = true,
  onClick,
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const memberId = member?.id;
  const photoRef = member?.photo;
  const memberName = member?.name || 'Member';

  useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;
    setImgError(false);

    async function loadPhoto() {
      // 1. If photo is a direct web URL or data URL
      if (
        photoRef &&
        (photoRef.startsWith('http://') ||
          photoRef.startsWith('https://') ||
          photoRef.startsWith('data:'))
      ) {
        if (isMounted) setObjectUrl(photoRef);
        return;
      }

      // 2. Otherwise load Blob from IndexedDB
      if (memberId) {
        try {
          const record = await getMemberPhoto(memberId);
          if (record && isMounted) {
            const blobToUse = preferFull
              ? record.blob
              : record.thumbnailBlob || record.blob;
            createdUrl = URL.createObjectURL(blobToUse);
            setObjectUrl(createdUrl);
            return;
          }
        } catch (err) {
          console.error('Error loading member avatar from IndexedDB:', err);
        }
      }

      if (isMounted) {
        setObjectUrl(null);
      }
    }

    loadPhoto();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [memberId, photoRef, preferFull]);

  const sizeStyle = SIZE_CLASSES[size];
  const roundedClass = ROUNDED_CLASSES[rounded];
  const initial = memberName ? memberName.charAt(0).toUpperCase() : '?';

  const handleClick = (e: React.MouseEvent) => {
    if (allowPreview) {
      e.stopPropagation();
      setIsPreviewOpen(true);
    }
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allowPreview && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      setIsPreviewOpen(true);
    }
  };

  const interactiveClasses = allowPreview
    ? 'cursor-pointer hover:opacity-95 hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 dark:hover:ring-offset-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all'
    : '';

  return (
    <>
      <div
        ref={containerRef}
        role={allowPreview ? 'button' : undefined}
        tabIndex={allowPreview ? 0 : undefined}
        aria-label={
          allowPreview
            ? `View profile photo for ${memberName}`
            : alt || `${memberName}'s avatar`
        }
        title={allowPreview ? `Click to enlarge photo of ${memberName}` : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`group relative ${sizeStyle.container} ${roundedClass} bg-emerald-600 text-white flex items-center justify-center shrink-0 overflow-hidden shadow-xs select-none ${interactiveClasses} ${className}`}
      >
        {objectUrl && !imgError ? (
          <img
            src={objectUrl}
            alt={alt || memberName}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : initial && initial !== '?' ? (
          <span className={`${sizeStyle.text} font-bold leading-none pointer-events-none`}>
            {initial}
          </span>
        ) : (
          <User className={`${sizeStyle.icon} text-white/90 pointer-events-none`} />
        )}

        {/* Subtle zoom indicator on hover when previewable and photo exists */}
        {allowPreview && objectUrl && !imgError && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow-md" />
          </div>
        )}
      </div>

      {/* Enlarged Image Preview Modal */}
      {allowPreview && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          member={member}
          triggerElement={containerRef.current}
        />
      )}
    </>
  );
};
