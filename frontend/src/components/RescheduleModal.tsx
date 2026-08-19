import React, { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { format, addMinutes, addHours, addDays, setHours, setMinutes } from 'date-fns';
import { rescheduleEmail } from '../lib/api';
import { EmailJob } from '../types';

interface RescheduleModalProps {
  email: EmailJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  email,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const defaultDate = addMinutes(new Date(), 5);
    return format(defaultDate, "yyyy-MM-dd'T'HH:mm");
  });
  const [activePreset, setActivePreset] = useState<string>('5m');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !email) return null;

  const handleApplyPreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    let targetDate = now;

    switch (preset) {
      case '1m':
        targetDate = addMinutes(now, 1);
        break;
      case '5m':
        targetDate = addMinutes(now, 5);
        break;
      case '30m':
        targetDate = addMinutes(now, 30);
        break;
      case '1h':
        targetDate = addHours(now, 1);
        break;
      case 'tomorrow':
        targetDate = setMinutes(setHours(addDays(now, 1), 9), 0);
        break;
      default:
        break;
    }

    setScheduledAt(format(targetDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetDate = new Date(scheduledAt);
    if (isNaN(targetDate.getTime())) {
      setError('Invalid date selected.');
      return;
    }

    try {
      setLoading(true);
      await rescheduleEmail(email.id, targetDate.toISOString());
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Failed to reschedule email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-sky-100 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-sky-100/80 flex items-center justify-between bg-gradient-to-r from-sky-50/60 via-white to-blue-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Reschedule Email</h2>
              <p className="text-xs text-slate-500">Update execution time in BullMQ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Info Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Recipient:</span>
              <span className="font-bold text-slate-900">{email.recipient}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Subject:</span>
              <span className="font-medium text-slate-700 truncate max-w-[240px]">{email.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Currently Scheduled:</span>
              <span className="text-amber-700 font-mono font-semibold">{format(new Date(email.scheduledAt), 'PP · p')}</span>
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select New Time</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              {[
                { id: '1m', label: 'In 1m' },
                { id: '5m', label: 'In 5m' },
                { id: '30m', label: 'In 30m' },
                { id: '1h', label: 'In 1h' },
                { id: 'tomorrow', label: 'Tomorrow 9am' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition ${
                    activePreset === preset.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-sky-300 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => {
                setActivePreset('custom');
                setScheduledAt(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 text-xs text-slate-900 outline-none font-mono"
            />
          </div>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-500/25 transition active:scale-95 border border-sky-400/30"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{loading ? 'Rescheduling...' : 'Confirm Reschedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
