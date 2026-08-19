import React from 'react';
import { Mail, Plus, Clock, CheckCircle2, LogOut } from 'lucide-react';

interface NavbarProps {
  activeTab: 'SCHEDULED' | 'SENT';
  setActiveTab: (tab: 'SCHEDULED' | 'SENT') => void;
  onOpenScheduleModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenScheduleModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
        {/* Left: Brand Logo in Sky Blue */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/25 border border-sky-400/30">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">
            ReachInbox
          </span>
        </div>

        {/* Center: Top Pill Tab Switcher (Scheduled Emails & Sent Emails) */}
        <div className="hidden md:flex items-center p-1 bg-slate-100/90 rounded-full border border-slate-200/80 shadow-inner">
          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === 'SCHEDULED'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled Emails</span>
          </button>
          <button
            onClick={() => setActiveTab('SENT')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === 'SENT'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sent Emails</span>
          </button>
        </div>

        {/* Right: Compose CTA & User Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Compose Email CTA */}
          <button
            onClick={onOpenScheduleModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 transition duration-150 active:scale-95 border border-sky-400/30"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Compose Email</span>
          </button>

          {/* User Account Card: Salman */}
          <div className="flex items-center space-x-3 pl-3 py-1 px-3 rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm hover:bg-slate-100 transition">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              S
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">Salman</div>
              <div className="text-[10px] text-slate-500 leading-tight">salman@reachinbox.ai</div>
            </div>
            <button
              className="text-slate-400 hover:text-slate-600 p-1 transition"
              title="User Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center justify-center px-4 pb-2">
        <div className="flex w-full items-center p-1 bg-slate-100 rounded-full border border-slate-200">
          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'SCHEDULED'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled</span>
          </button>
          <button
            onClick={() => setActiveTab('SENT')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'SENT'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sent</span>
          </button>
        </div>
      </div>
    </header>
  );
};
