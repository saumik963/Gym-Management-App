import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Member } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { processUploadedPhoto, getMemberPhoto } from '../../services/photoService';
import { ImagePreviewModal } from '../common/ImagePreviewModal';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Weight, 
  Ruler, 
  AlertCircle, 
  Camera, 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  ZoomIn 
} from 'lucide-react';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: any, photoBlobs?: { fullBlob: Blob; thumbnailBlob?: Blob } | null) => Promise<void>;
  initialData?: Member | null;
  nextMemberId?: string;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  nextMemberId = 'GYM-1001',
}) => {
  const { settings } = useSettings();

  const [formData, setFormData] = useState({
    memberId: nextMemberId,
    name: '',
    phone: '',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlyFee: settings.defaultMonthlyFee || 1000,
    weight: 70,
    height: 170,
    gender: 'male' as 'male' | 'female' | 'other',
    dob: '',
    emergencyContact: '',
    notes: '',
    photo: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Photo management state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newPhotoBlobs, setNewPhotoBlobs] = useState<{ fullBlob: Blob; thumbnailBlob: Blob } | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean up object URLs
  const clearObjectUrl = () => {
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    clearObjectUrl();
    setNewPhotoBlobs(null);
    setPhotoRemoved(false);
    setPhotoError(null);

    let isMounted = true;

    if (initialData) {
      setFormData({
        memberId: initialData.memberId,
        name: initialData.name,
        phone: initialData.phone,
        address: initialData.address,
        joiningDate: initialData.joiningDate,
        monthlyFee: initialData.monthlyFee,
        weight: initialData.weight,
        height: initialData.height,
        gender: initialData.gender,
        dob: initialData.dob || '',
        emergencyContact: initialData.emergencyContact || '',
        notes: initialData.notes || '',
        photo: initialData.photo || '',
        status: initialData.status,
      });

      // Load existing photo preview
      if (initialData.photo && (initialData.photo.startsWith('http') || initialData.photo.startsWith('data:'))) {
        setPhotoPreview(initialData.photo);
      } else if (initialData.photo || initialData.id) {
        getMemberPhoto(initialData.id).then((record) => {
          if (isMounted && record) {
            const url = URL.createObjectURL(record.blob);
            activeObjectUrlRef.current = url;
            setPhotoPreview(url);
          } else if (isMounted) {
            setPhotoPreview(null);
          }
        }).catch(() => {
          if (isMounted) setPhotoPreview(null);
        });
      } else {
        setPhotoPreview(null);
      }
    } else {
      setFormData({
        memberId: nextMemberId,
        name: '',
        phone: '',
        address: '',
        joiningDate: new Date().toISOString().split('T')[0],
        monthlyFee: settings.defaultMonthlyFee || 1000,
        weight: 70,
        height: 170,
        gender: 'male',
        dob: '',
        emergencyContact: '',
        notes: '',
        photo: '',
        status: 'active',
      });
      setPhotoPreview(null);
    }
    setErrors({});

    return () => {
      isMounted = false;
      clearObjectUrl();
    };
  }, [initialData, nextMemberId, isOpen, settings.defaultMonthlyFee]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setIsProcessingPhoto(true);

    try {
      const processed = await processUploadedPhoto(file);
      clearObjectUrl();

      const previewUrl = URL.createObjectURL(processed.fullBlob);
      activeObjectUrlRef.current = previewUrl;

      setPhotoPreview(previewUrl);
      setNewPhotoBlobs(processed);
      setPhotoRemoved(false);
    } catch (err: any) {
      setPhotoError(err?.message || 'Failed to process selected image');
    } finally {
      setIsProcessingPhoto(false);
      // Reset input element so selecting same file again still fires change
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    clearObjectUrl();
    setPhotoPreview(null);
    setNewPhotoBlobs(null);
    setPhotoRemoved(true);
    setPhotoError(null);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (formData.monthlyFee <= 0) errs.monthlyFee = 'Monthly fee must be greater than 0';
    if (!formData.joiningDate) errs.joiningDate = 'Joining date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let photoActionPayload: { fullBlob: Blob; thumbnailBlob?: Blob } | null | undefined = undefined;
      if (photoRemoved) {
        photoActionPayload = null; // Remove
      } else if (newPhotoBlobs) {
        photoActionPayload = newPhotoBlobs; // Replace or newly added
      }

      await onSave(formData, photoActionPayload);
      clearObjectUrl();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.message || 'Failed to save member' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Member Details' : 'Create New Gym Member'}
      subtitle="Fill in member profile information. Changes apply instantly."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {errors.submit && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Profile Photo Upload Field */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Profile Photo (Offline Storage)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Photo Preview / Default Avatar */}
            <div className="relative group shrink-0">
              <div
                role={photoPreview ? 'button' : undefined}
                tabIndex={photoPreview ? 0 : undefined}
                aria-label={photoPreview ? `View full-size photo for ${formData.name || 'member'}` : undefined}
                title={photoPreview ? 'Click to enlarge photo' : undefined}
                onClick={() => {
                  if (photoPreview) setIsPreviewOpen(true);
                }}
                onKeyDown={(e) => {
                  if (photoPreview && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setIsPreviewOpen(true);
                  }
                }}
                className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-3xl overflow-hidden shadow-xs border-2 border-white dark:border-slate-800 ${
                  photoPreview
                    ? 'cursor-pointer hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 dark:hover:ring-offset-slate-900 transition-all'
                    : ''
                }`}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : formData.name ? (
                  formData.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-10 h-10 text-white/80" />
                )}

                {/* Zoom icon hint on hover */}
                {photoPreview && (
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
              {isProcessingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white text-[11px] font-bold pointer-events-none">
                  Resizing...
                </div>
              )}
            </div>

            {/* Actions & Instructions */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {/* Upload from device */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingPhoto}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoPreview ? 'Change Photo' : 'Choose Photo'}</span>
                </button>

                {/* Mobile Camera Capture */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="user"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessingPhoto}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                  title="Take photo using camera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Photo</span>
                </button>

                {/* Remove Photo */}
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Supports JPG, PNG, and WebP (up to 5 MB). Resized & stored 100% offline in IndexedDB.
              </p>

              {photoError && (
                <p className="text-rose-500 dark:text-rose-400 text-xs font-medium flex items-center space-x-1 justify-center sm:justify-start">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{photoError}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Member ID & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Member ID (Auto)
            </label>
            <input
              type="text"
              readOnly
              value={formData.memberId}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. Tanvir Hossain"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border ${
                  errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
            {errors.name && <p className="text-rose-500 text-[11px] mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. 01711000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border ${
                  errors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
            {errors.phone && <p className="text-rose-500 text-[11px] mt-0.5">{errors.phone}</p>}
          </div>
        </div>

        {/* Joining Date & Monthly Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Joining Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Fee ({settings.currency}) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: parseFloat(e.target.value) || 0 })}
                className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border ${
                  errors.monthlyFee ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
            {errors.monthlyFee && <p className="text-rose-500 text-[11px] mt-0.5">{errors.monthlyFee}</p>}
          </div>
        </div>

        {/* Weight & Height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Weight (kg)
            </label>
            <div className="relative">
              <Weight className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Height (cm)
            </label>
            <div className="relative">
              <Ruler className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Address
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g. Dhanmondi, Dhaka"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Optional DOB & Emergency Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Emergency Contact (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 01800000000 (Relative)"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes / Goals
          </label>
          <textarea
            rows={2}
            placeholder="Weight loss, bodybuilding, medical conditions, etc."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Member' : 'Save Member'}
          </button>
        </div>
      </form>
    </Modal>

    {/* Enlarged Image Preview */}
    {isPreviewOpen && (
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={photoPreview}
        member={{
          name: formData.name || 'Member',
          memberId: initialData?.memberId,
        }}
      />
    )}
    </>
  );
};
