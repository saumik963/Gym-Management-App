import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Member } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { User, Phone, MapPin, Calendar, DollarSign, Weight, Ruler, AlertCircle } from 'lucide-react';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: any) => Promise<void>;
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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
    }
    setErrors({});
  }, [initialData, nextMemberId, isOpen, settings.defaultMonthlyFee]);

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
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.message || 'Failed to save member' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
};
