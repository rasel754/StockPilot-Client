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
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
          S
        </div>
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
