import React from 'react';

interface VioraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark' | 'brand';
  className?: string;
}

export const VioraLogo: React.FC<VioraLogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'brand',
  className = '',
}) => {
  const iconSizes = {
    // sm: 'w-7 h-7',
    // md: 'w-9 h-9',
    // lg: 'w-12 h-12',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Stylized Tooth Logo matching Viora's brand image */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl overflow-hidden shadow-sm transition-transform hover:scale-105 duration-200 shrink-0 ${
          variant === 'light'
            ? 'bg-white/10 ring-1 ring-white/20'
            : 'bg-gradient-to-br from-sky-500 to-sky-600 ring-1 ring-sky-400/40 shadow-sky-500/20'
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-[84%] h-[84%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top smile crescent arc */}
          <path
            d="M 64 12 C 72 10, 80 14, 82 17 C 76 19, 70 17, 64 12 Z"
            // d="M 68 28 C 74 24, 82 25, 86 28" strokeWidth="5.5"
            fill={variant === 'light' ? '#ffffff' : '#ffffff'}
          />
          {/* Main tooth outline and stylized root */}
          <path
            // d="M 33 22 
            //    C 22 24, 15 35, 17 50 
            //    C 19 63, 27 75, 41 85 
            //    C 51 92, 54 96, 56 94 
            //    C 57 91, 57 85, 57 75 
            //    C 70 70, 77 56, 76 34 
            //    C 75 22, 70 17, 65 18 
            //    C 58 26, 48 30, 42 27 
            //    C 38 25, 35 23, 33 22 Z"
            d="M 46 78 C 36 68, 22 52, 22 36 C 22 24, 30 18, 42 22 C 50 25, 54 28, 62 25 C 74 20, 84 26, 86 36 C 88 50, 78 72, 60 90 C 58 78, 54 58, 46 46"
            stroke={variant === 'light' ? '#ffffff' : '#ffffff'}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Internal smile/leaf curve */}
          <path
            d="M 42 47 
               C 49 52, 55 60, 56 75"
            stroke={variant === 'light' ? '#ffffff' : '#ffffff'}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-bold tracking-tight font-display ${textSizes[size]} ${
              variant === 'light' ? 'text-white' : 'text-slate-900'
            }`}
          >
            VIORA
          </span>
          <span
            className={`text-[9px] uppercase tracking-widest font-semibold ${
              variant === 'light' ? 'text-sky-200' : 'text-sky-600'
            }`}
          >
            Speciality Dental Center
          </span>
        </div>
      )}
    </div>
  );
};
