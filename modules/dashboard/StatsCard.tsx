import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  bgColor = 'bg-muted/40',
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className={cn('p-3.5 rounded-2xl transition-all', bgColor, iconColor)}>
          <Icon size={24} />
        </div>
      </CardContent>
    </Card>
  );
}
