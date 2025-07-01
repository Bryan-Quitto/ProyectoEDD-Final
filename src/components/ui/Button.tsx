import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';

const buttonVariants = {
  variant: {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-surface text-text-primary border border-DEFAULT hover:bg-gray-100',
    destructive: 'bg-error text-white hover:bg-red-600',
    destructive_outline: 'border border-red-500 text-red-500 bg-transparent hover:bg-red-500/10',
    ghost: 'hover:bg-gray-100',
    link: 'text-primary underline-offset-4 hover:underline',
    outline: 'border border-primary text-primary bg-transparent hover:bg-primary/10',
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', asChild = false, isLoading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
          ${buttonVariants.variant[variant]}
          ${buttonVariants.size[size]}
          ${className || ''}`
        }
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && !asChild ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button };