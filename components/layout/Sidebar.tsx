'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Layers, ArrowLeftRight, ShoppingCart, Clock, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/categories', icon: Layers, label: 'Categories' },
  { path: '/stock-entries', icon: ArrowLeftRight, label: 'Stock Entries' },
  { path: '/sales', icon: ShoppingCart, label: 'Sales' },
  { path: '/expiry-tracking', icon: Clock, label: 'Expiry Tracking' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col h-screen shrink-0',
        isOpen ? 'w-64 border-r' : 'w-0 border-r-0'
      )}
    >
      <div className="p-6 border-b border-border flex items-center gap-2">
        <svg className="h-8 w-8 text-primary shrink-0" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="180" height="180" rx="40" fill="currentColor" />
          <rect x="45" y="105" width="14" height="35" rx="4" fill="#FFFFFF" opacity="0.6" />
          <rect x="68" y="85" width="14" height="55" rx="4" fill="#FFFFFF" opacity="0.8" />
          <rect x="91" y="60" width="14" height="80" rx="4" fill="#FFFFFF" />
          <path d="M145 35 L85 75 L112 87 Z" fill="#E0E7FF" opacity="0.7" />
          <path d="M145 35 L112 87 L125 110 Z" fill="#FFFFFF" />
          <path d="M145 35 L112 87" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
          <circle cx="145" cy="35" r="6" fill="#0EA5E9" />
        </svg>
        <span className="text-xl font-bold tracking-tight text-primary">StockPilot</span>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = pathname === path || pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
                )}
              >
                <Icon size={18} className={cn('transition-transform group-hover:scale-105', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-border bg-muted/20">
        <div className="text-[10px] text-muted-foreground text-center font-semibold uppercase tracking-wider">
          StockPilot v1.0.0
        </div>
      </div>
    </aside>
  );
}
