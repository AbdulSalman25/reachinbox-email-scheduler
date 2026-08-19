import React, { useState, useRef } from 'react';
import { X, Mail, Upload, Clock, Zap, Shield, Send, AlertCircle, Sparkles } from 'lucide-react';
import { format, addSeconds, addMinutes, addHours, setHours, setMinutes, addDays } from 'date-fns';
import { scheduleEmail } from '../lib/api';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [senderProfile, setSenderProfile] = useState('Salman <salman@reachinbox.ai>');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pastedLeads, setPastedLeads] = useState('');
  const [uploadedFileSummary, setUploadedFileSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scheduling & Throttling
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const defaultDate = addMinutes(new Date(), 2);
    return format(defaultDate, "yyyy-MM-dd'T'HH:mm");
  });
  const [minDelayPerSend, setMinDelayPerSend] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(200);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle CSV / TXT file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = text.match(emailRegex) || [];
        const uniqueEmails = Array.from(new Set(matches));

        if (uniqueEmails.length > 0) {
          const currentList = pastedLeads.trim() ? pastedLeads.split(/[\n,]+/).map((s) => s.trim()) : [];
          const combined = Array.from(new Set([...currentList, ...uniqueEmails])).join('\n');
          setPastedLeads(combined);
          setUploadedFileSummary(`Loaded ${uniqueEmails.length} lead(s) from "${file.name}"`);
        } else {
          setError(`No valid email addresses found in "${file.name}"`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPreset = (preset: string) => {
    const now = new Date();
    let targetDate = now;

    switch (preset) {
      case '30s':
        targetDate = addSeconds(now, 30);
        break;
      case '2m':
        targetDate = addMinutes(now, 2);
        break;
      case '10m':
        targetDate = addMinutes(now, 10);
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

  const handleLoadSample = () => {
    setSenderProfile('Salman <salman@reachinbox.ai>');
    setSubject('Supercharging your outreach pipeline with ReachInbox AI');
    setBody(
      `Hi {{first_name}},\n\nWe noticed your team is scaling outbound outreach this quarter. ReachInbox simplifies automated prospecting, persistent job scheduling with BullMQ, and delivers high deliverability with zero fuss.\n\nWould you have 10 minutes this Thursday for a quick walkthrough?\n\nBest,\nSalman Khan\nReachInbox.ai`
    );
    setPastedLeads(
      `alex.lead1@example.com\nsarah.lead2@example.com\njames.lead3@example.com`
    );
    handleApplyPreset('30s');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const leads = Array.from(new Set(pastedLeads.match(emailRegex) || []));

    if (leads.length === 0) {
      setError('Please enter at least one recipient email address or upload a CSV file.');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter an email subject.');
      return;
    }
    if (!body.trim()) {
      setError('Please enter the email body.');
      return;
    }
    if (!scheduledAt) {
      setError('Please select a scheduled start date & time.');
      return;
    }

    const targetDate = new Date(scheduledAt);
    if (isNaN(targetDate.getTime())) {
      setError('Invalid scheduled date/time.');
      return;
    }

    try {
      setLoading(true);
      await scheduleEmail({
        recipients: leads,
        senderProfile,
        subject: subject.trim(),
        body: body.trim(),
        scheduledAt: targetDate.toISOString(),
        minDelayPerSend: Number(minDelayPerSend) || 2,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Failed to schedule campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-sky-100 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-sky-100/80 flex items-center justify-between bg-gradient-to-r from-sky-50/60 via-white to-blue-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Compose Cold Email Campaign</h2>
              <p className="text-xs text-slate-500">Configure scheduling parameters, leads, and throttling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-slate-800">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Auto-fill sample button */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-slate-600">Campaign Details</span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-fill Sample Outreach
            </button>
          </div>

          {/* 1. Sending Profile */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Sending Profile
            </label>
            <select
              value={senderProfile}
              onChange={(e) => setSenderProfile(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-slate-800 transition cursor-pointer"
            >
              <option value="Salman <salman@reachinbox.ai>">Salman &lt;salman@reachinbox.ai&gt;</option>
              <option value="ReachInbox Growth Team <outreach@reachinbox.ai>">ReachInbox Growth Team &lt;outreach@reachinbox.ai&gt;</option>
              <option value="Sales Team <sales@reachinbox.ai>">Sales Team &lt;sales@reachinbox.ai&gt;</option>
            </select>
          </div>

          {/* 2. Email Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Subject
            </label>
            <input
              type="text"
              placeholder="e.g. Scaling cold outreach with AI workflows"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition"
              required
            />
          </div>

          {/* 3. Email Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Body
            </label>
            <textarea
              rows={4}
              placeholder="Hi {{first_name}}, We noticed your team at..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition font-sans leading-relaxed"
              required
            />
          </div>

          {/* 4. Target Lead List (CSV upload + Manual Paste) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Lead List (CSV / TXT upload or manual entry)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50/70 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition group min-h-[105px]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-sky-100 flex items-center justify-center text-sky-600 mb-1.5 group-hover:scale-110 transition">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Upload CSV / TXT File</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Click to browse files</span>
                {uploadedFileSummary && (
                  <span className="text-[10px] font-bold text-sky-700 mt-1 font-mono">
                    {uploadedFileSummary}
                  </span>
                )}
              </div>

              {/* Paste Textarea */}
              <div>
                <textarea
                  rows={4}
                  placeholder="Or paste emails here (separated by newlines or commas)..."
                  value={pastedLeads}
                  onChange={(e) => setPastedLeads(e.target.value)}
                  className="w-full h-full min-h-[105px] px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-xs text-slate-800 placeholder:text-slate-400 transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* 5. Scheduler & Rate Limit Controls */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Scheduler & Rate Limit Controls
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Start Date & Time */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-600" />
                  <span>Start Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 text-xs text-slate-800 outline-none font-mono"
                />
              </div>

              {/* Min Delay per Send */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Min Delay per Send (s)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={minDelayPerSend}
                  onChange={(e) => setMinDelayPerSend(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 text-xs text-slate-800 outline-none font-mono"
                />
              </div>

              {/* Hourly Sending Limit */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-500" />
                  <span>Hourly Sending Limit</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 text-xs text-slate-800 outline-none font-mono"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1 self-center">Presets:</span>
              {[
                { id: '30s', label: 'In 30s' },
                { id: '2m', label: 'In 2m' },
                { id: '10m', label: 'In 10m' },
                { id: '1h', label: 'In 1h' },
                { id: 'tomorrow', label: 'Tomorrow 9am' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-600 text-[11px] font-medium transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-sky-500/30 transition active:scale-95 border border-sky-400/30"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{loading ? 'Scheduling Campaign in BullMQ...' : 'Schedule Email Campaign'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
