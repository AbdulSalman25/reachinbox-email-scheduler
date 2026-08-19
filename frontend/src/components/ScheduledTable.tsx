import React, { useState, useEffect } from 'react';
import { Clock, Ban, Calendar, Eye, Send } from 'lucide-react';
import { EmailJob } from '../types';
import { formatDate, getCountdownTime } from '../lib/utils';
import { cancelEmail } from '../lib/api';

interface ScheduledTableProps {
  emails: EmailJob[];
  onRefresh: () => void;
  onSelectEmail: (email: EmailJob) => void;
  onRescheduleEmail: (email: EmailJob) => void;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({
  emails,
  onRefresh,
  onSelectEmail,
  onRescheduleEmail,
}) => {
  const [, setTick] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCancel = async (e: React.MouseEvent, email: EmailJob) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to cancel the scheduled email to ${email.recipient}?`)) {
      return;
    }

    try {
      setCancellingId(email.id);
      await cancelEmail(email.id);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to cancel email');
    } finally {
      setCancellingId(null);
    }
  };

  if (emails.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Scheduled Emails</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Click "Compose Email" to queue a new task with BullMQ persistent delayed scheduling.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <th className="py-3.5 px-6">Recipient Email</th>
            <th className="py-3.5 px-4">Subject</th>
            <th className="py-3.5 px-4">Sender Profile</th>
            <th className="py-3.5 px-4">Scheduled Date & Time</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-600">
          {emails.map((email) => {
            const countdown = getCountdownTime(email.scheduledAt);
            const isCancelling = cancellingId === email.id;

            return (
              <tr
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className="hover:bg-slate-50/80 cursor-pointer transition duration-150 group"
              >
                {/* Recipient */}
                <td className="py-4 px-6 font-bold text-slate-900">
                  <div className="flex items-center space-x-2">
                    <Send className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    <span>{email.recipient}</span>
                  </div>
                </td>

                {/* Subject */}
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-800 truncate max-w-xs">
                    {email.subject}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5 font-sans">
                    {email.body.slice(0, 50)}...
                  </div>
                </td>

                {/* Sender Profile */}
                <td className="py-4 px-4 text-slate-600 font-medium truncate max-w-[160px]">
                  {email.senderProfile || 'Salman <salman@reachinbox.ai>'}
                </td>

                {/* Scheduled Date */}
                <td className="py-4 px-4 font-mono text-slate-700">
                  {formatDate(email.scheduledAt)}
                </td>

                {/* Status with countdown */}
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-sm font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                    Scheduled ({countdown.text})
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onRescheduleEmail(email)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-sm"
                      title="Reschedule Time"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleCancel(e, email)}
                      disabled={isCancelling}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition disabled:opacity-50 shadow-sm"
                      title="Cancel Job"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectEmail(email)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-sm"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
