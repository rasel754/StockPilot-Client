'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/api';
import Sidebar from './Sidebar';
import { Menu, X, Bell, LogOut, Sun, Moon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToastContainer } from '@/components/ui/toast';
import Link from 'next/link';

export default function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Route Protection Guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Dark Mode Theme Sync
  useEffect(() => {
    const isDark =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  // Fetch notifications for live unread badge
  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll(),
    enabled: isAuthenticated,
    refetchInterval: 15000, // Sync every 15s
  });
  
  const unreadCount = (notifRes?.data || []).filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary size-10 mb-4" />
        <span className="text-sm font-semibold text-muted-foreground animate-pulse">
          Securing StockPilot workspace...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Prevents layout flashing before redirection
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Dynamic Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Main Header */}
        <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6 shadow-xs shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="hidden md:inline-block text-xs bg-muted px-2.5 py-1 rounded-full font-bold text-muted-foreground border border-border">
              Role: {user?.role}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode Selector */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications Bell */}
            <Link
              href="/notifications"
              className="p-2 hover:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground relative"
              aria-label="Notifications"
            >
              <Bell size={18} className={unreadCount > 0 ? 'animate-bounce' : ''} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white ring-2 ring-card">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Info & Logout */}
            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-foreground leading-none">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-1">Logged In</span>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={logout}
              className="flex items-center gap-1.5 h-8 font-semibold text-xs px-3"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Dynamic Nested Content Page container */}
        <main className="flex-1 overflow-auto bg-muted/10 relative">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Global Toast Notifiers Container */}
      <ToastContainer />
    </div>
  );
}
