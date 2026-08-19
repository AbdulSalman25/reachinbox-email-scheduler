import React from 'react';
import { Database, Server, MailCheck, Activity, Cpu, ExternalLink } from 'lucide-react';
import { DashboardStats } from '../types';

interface QueueHealthCardProps {
  stats: DashboardStats | null;
}

export const QueueHealthCard: React.FC<QueueHealthCardProps> = ({ stats }) => {
  const queue = stats?.queue || {
    waiting: 0,
    active: 0,
    delayed: 0,
    completed: 0,
    failed: 0,
    paused: 0,
  };

  const ethereal = stats?.etherealAccount;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Persistent Queue & SMTP Infrastructure
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Operational
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              BullMQ + Redis delay scheduler with automatic restart persistence and Ethereal fake SMTP
            </p>
          </div>
        </div>

        {/* Live Queue Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <span className="text-slate-400">Delayed:</span>
            <span className="font-semibold text-amber-400">{queue.delayed}</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <span className="text-slate-400">Active:</span>
            <span className="font-semibold text-blue-400">{queue.active}</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <span className="text-slate-400">Completed:</span>
            <span className="font-semibold text-emerald-400">{queue.completed}</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <span className="text-slate-400">Failed:</span>
            <span className="font-semibold text-rose-400">{queue.failed}</span>
          </div>
        </div>
      </div>

      {/* Subsystems info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
        {/* Redis & BullMQ */}
        <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-start space-x-3">
          <Database className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-slate-200">Redis & BullMQ Engine</div>
            <div className="text-slate-400 mt-0.5">Persistence: Redis AOF / ZSet</div>
            <div className="text-slate-500 text-[11px] mt-1 font-mono">Queue: email-scheduler-queue</div>
          </div>
        </div>

        {/* Ethereal SMTP */}
        <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-start space-x-3">
          <MailCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-slate-200 flex items-center justify-between">
              <span>Ethereal Fake SMTP</span>
              {ethereal?.webUrl && (
                <a
                  href={ethereal.webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 text-[11px]"
                >
                  Login <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <div className="text-slate-400 mt-0.5 truncate" title={ethereal?.user || 'Auto Test Account'}>
              User: <span className="font-mono text-slate-300">{ethereal?.user || 'Generated on start'}</span>
            </div>
            <div className="text-slate-500 text-[11px] mt-1">Host: smtp.ethereal.email:587</div>
          </div>
        </div>

        {/* Worker Resilience */}
        <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 flex items-start space-x-3">
          <Cpu className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-slate-200">Worker & Retry Strategy</div>
            <div className="text-slate-400 mt-0.5">Concurrency: 5 | Max Retries: 3</div>
            <div className="text-slate-500 text-[11px] mt-1">Backoff: 5s Exponential · Stalled Recovery</div>
          </div>
        </div>
      </div>
    </div>
  );
};
