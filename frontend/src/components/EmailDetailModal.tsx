import React from 'react';
import { X, ExternalLink, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import { EmailJob } from '../types';
import { formatDate, getStatusBadgeConfig } from '../lib/utils';

interface EmailDetailModalProps {
  email: EmailJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  email,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !email) return null;

  const badge = getStatusBadgeConfig(email.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-sky-100 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50/60 via-white to-blue-50/60 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 truncate max-w-md">{email.subject}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">To: {email.recipient}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-800">
          {/* Ethereal Preview Banner if sent */}
          {email.etherealPreviewUrl && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900">Delivered to Ethereal SMTP</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Click below to open and inspect the live rendered email in Ethereal web viewer
                  </p>
                </div>
              </div>
              <a
                href={email.etherealPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm shadow-sky-600/25 transition active:scale-95 border border-sky-400/30"
              >
                <span>View Email</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Error Message if failed */}
          {email.errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-rose-800">Failure Diagnostic</h4>
                <p className="text-rose-700 mt-1 font-mono text-[11px] break-all">{email.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Sender Profile</span>
              <span className="text-slate-800 font-medium truncate block">{email.senderProfile || 'Salman'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Scheduled For</span>
              <span className="text-slate-800 font-mono">{formatDate(email.scheduledAt)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Sent At</span>
              <span className="text-slate-800 font-mono">{email.sentAt ? formatDate(email.sentAt) : 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Retry Attempts</span>
              <span className="text-slate-800 font-mono">
                {email.attempts} / {email.maxAttempts}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">BullMQ Job ID</span>
              <span className="text-slate-700 font-mono truncate block" title={email.bullmqJobId || '-'}>
                {email.bullmqJobId || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">Created On</span>
              <span className="text-slate-800 font-mono">{formatDate(email.createdAt)}</span>
            </div>
          </div>

          {/* Email Body Preview */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">Message Body</span>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed max-h-56 overflow-y-auto">
              {email.body}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
