import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { EmailJob } from '../types';
import { formatDate } from '../lib/utils';

interface SentTableProps {
  emails: EmailJob[];
  onSelectEmail: (email: EmailJob) => void;
}

export const SentTable: React.FC<SentTableProps> = ({
  emails,
  onSelectEmail,
}) => {
  if (emails.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Sent Emails Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          When BullMQ processes scheduled emails, they will appear here with instant Ethereal live preview links.
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
            <th className="py-3.5 px-4">Sent Date & Time</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-6 text-right">Ethereal Preview</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-600">
          {emails.map((email) => {
            return (
              <tr
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className="hover:bg-slate-50/80 cursor-pointer transition duration-150 group"
              >
                {/* Recipient Email */}
                <td className="py-4 px-6 font-bold text-slate-900">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
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

                {/* Sent Date & Time */}
                <td className="py-4 px-4 font-mono text-slate-700">
                  {formatDate(email.sentAt)}
                </td>

                {/* Status Badge */}
                <td className="py-4 px-4">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sent (Ethereal SMTP)</span>
                  </span>
                </td>

                {/* Ethereal Preview Button (Sky Blue) */}
                <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-2">
                    {email.etherealPreviewUrl ? (
                      <a
                        href={email.etherealPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-[11px] font-bold shadow-md shadow-sky-500/25 transition active:scale-95 border border-sky-400/30"
                      >
                        <span>View Email</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={() => onSelectEmail(email)}
                        className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs transition"
                      >
                        Details
                      </button>
                    )}
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
