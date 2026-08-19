import React from 'react';
import { Clock, Shield, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const counts = stats?.counts || {
    total: 0,
    scheduled: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
    deferred: 0,
  };

  const quota = stats?.quota || {
    limit: 200,
    usedThisHour: counts.sent,
    remaining: Math.max(0, 200 - counts.sent),
  };

  const percentUsed = Math.min(100, Math.round((quota.usedThisHour / quota.limit) * 100));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* 1. Pending Schedule */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-sm hover:shadow transition-all duration-200 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 flex-shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 leading-none">
            {counts.scheduled}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Pending Schedule
          </div>
        </div>
      </div>

      {/* 2. Deferred (Rate Limited) */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-sm hover:shadow transition-all duration-200 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 flex-shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 leading-none">
            {counts.deferred || 0}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Deferred (Rate Limited)
          </div>
        </div>
      </div>

      {/* 3. Emails Sent */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-sm hover:shadow transition-all duration-200 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 leading-none">
            {counts.sent}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Emails Sent
          </div>
        </div>
      </div>

      {/* 4. Delivery Failures */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-sm hover:shadow transition-all duration-200 flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 leading-none">
            {counts.failed}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Delivery Failures
          </div>
        </div>
      </div>

      {/* 5. Hourly Quota (Sky Blue) */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-sm hover:shadow transition-all duration-200 col-span-2 md:col-span-1 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-600">
            <Zap className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
            <span>Hourly Quota</span>
          </div>
          <span className="text-xs font-bold text-sky-600 font-mono">
            {quota.usedThisHour} / {quota.limit}
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5 my-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <div className="text-[10px] text-slate-500 font-medium">
          {quota.remaining} sends left this hour
        </div>
      </div>
    </div>
  );
};
