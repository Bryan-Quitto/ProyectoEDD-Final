import React from 'react';

const spinnerVariants = {
  size: {
    default: 'h-8 w-8',
    sm: 'h-4 w-4',
    lg: 'h-12 w-12',
    xl: 'h-24 w-24',
  },
};

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: keyof typeof spinnerVariants.size;
}

const Spinner = ({ className, size = 'default', ...props }: SpinnerProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${spinnerVariants.size[size]} ${className || ''}`}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};

export { Spinner };