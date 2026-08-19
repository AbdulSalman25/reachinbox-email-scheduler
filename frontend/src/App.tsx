import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { ScheduledTable } from './components/ScheduledTable';
import { SentTable } from './components/SentTable';
import { ScheduleModal } from './components/ScheduleModal';
import { RescheduleModal } from './components/RescheduleModal';
import { EmailDetailModal } from './components/EmailDetailModal';
import { fetchDashboardStats, fetchEmails } from './lib/api';
import { DashboardStats, EmailJob, EmailStatus } from './types';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';

export function App() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'SENT'>('SENT'); // Match active tab in screenshot or default
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [detailEmail, setDetailEmail] = useState<EmailJob | null>(null);
  const [rescheduleTargetEmail, setRescheduleTargetEmail] = useState<EmailJob | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const queryStatus =
        statusFilter !== 'ALL'
          ? (statusFilter as EmailStatus)
          : activeTab === 'SCHEDULED'
          ? 'SCHEDULED'
          : 'SENT';

      const [statsData, emailsData] = await Promise.all([
        fetchDashboardStats(),
        fetchEmails({
          status: queryStatus,
          search: searchQuery.trim() ? searchQuery.trim() : undefined,
          limit: 100,
        }),
      ]);
      setStats(statsData);
      setEmails(emailsData.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTab, statusFilter, searchQuery]);

  // Initial load and dependency trigger
  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-sky-pattern text-slate-900 flex flex-col font-sans selection:bg-sky-600 selection:text-white">
      {/* Top Navigation Bar in White & Sky Blue with Salman Profile */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setStatusFilter('ALL');
        }}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Top 5 Metric Cards */}
        <StatsCards stats={stats} />

        {/* Main Table Card (White & Sky Blue Theme) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
            <div className="flex flex-1 items-center space-x-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recipient or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-2 pl-3.5 pr-8 rounded-full outline-none focus:border-sky-500 cursor-pointer transition"
                >
                  <option value="ALL">All Delivery Statuses</option>
                  <option value="SCHEDULED">Scheduled Only</option>
                  <option value="SENT">Sent Only</option>
                  <option value="FAILED">Failures Only</option>
                  <option value="CANCELLED">Cancelled Only</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Refresh Action */}
            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                disabled={isRefreshing}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-sky-200 bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs transition duration-150 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          {activeTab === 'SCHEDULED' ? (
            <ScheduledTable
              emails={emails}
              onRefresh={loadData}
              onSelectEmail={(email) => setDetailEmail(email)}
              onRescheduleEmail={(email) => setRescheduleTargetEmail(email)}
            />
          ) : (
            <SentTable
              emails={emails}
              onSelectEmail={(email) => setDetailEmail(email)}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        ReachInbox Full-Stack Email Job Scheduler · TypeScript · Express · BullMQ · Redis · Prisma
      </footer>

      {/* Modals */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={loadData}
      />

      <RescheduleModal
        email={rescheduleTargetEmail}
        isOpen={!!rescheduleTargetEmail}
        onClose={() => setRescheduleTargetEmail(null)}
        onSuccess={loadData}
      />

      <EmailDetailModal
        email={detailEmail}
        isOpen={!!detailEmail}
        onClose={() => setDetailEmail(null)}
      />
    </div>
  );
}
