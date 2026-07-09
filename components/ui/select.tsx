import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%2522http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%2522%20width%3D%252224%2522%20height%3D%252224%2522%20viewBox%3D%25220%200%2024%2024%2522%20fill%3D%2522none%2522%20stroke%3D%2522%236b7280%2522%20stroke-width%3D%25222%2522%20stroke-linecap%3D%2522round%2522%20stroke-linejoin%3D%2522round%2522%3E%3Cpolyline%20points%3D%25226%209%2012%2015%2018%209%2522%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-[size:1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat pr-10',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
