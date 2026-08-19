import React from 'react';

interface AcademiaValenciaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showSubtitle?: boolean;
  subtitleText?: string;
  variant?: 'icon' | 'horizontal' | 'badge' | 'card';
  theme?: 'light' | 'dark' | 'auto';
  onClick?: () => void;
}

export const AcademiaValenciaLogo: React.FC<AcademiaValenciaLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  subtitleText = 'Excelencia Educativa y Conocimiento que Transforma',
  variant = 'horizontal',
  theme = 'auto',
  onClick
}) => {
  // Size configurations
  const iconSizeMap = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
    hero: 'w-20 h-20 rounded-3xl'
  };

  const titleSizeMap = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-base font-black',
    lg: 'text-lg font-black',
    xl: 'text-2xl font-black',
    hero: 'text-3xl font-black'
  };

  const subtitleSizeMap = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
    hero: 'text-base'
  };

  // The official SVG Owl Mascot
  const OwlSvg = ({ strokeWidth = 10, fill = '#FF6600' }: { strokeWidth?: number; fill?: string }) => (
    <svg
      viewBox="0 0 200 240"
      className="w-full h-full"
      style={{ overflow: 'visible' }}
    >
      <g fill="none" stroke="#FFFFFF" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {/* Graduation Cap Mortarboard (Diamond Top) */}
        <polygon points="20,40 100,5 180,40 100,75" fill={fill} />
        
        {/* Graduation Cap Skullcap Band */}
        <path d="M 45 55 L 45 78 C 45 92, 155 92, 155 78 L 155 55" fill={fill} />
        
        {/* Tassel on the right side of the cap */}
        <path d="M 166 48 L 166 105" />
        <circle cx="166" cy="112" r="4.5" fill="#FFFFFF" />

        {/* Owl Face / Body Outer Contour (Shield shape tapering to a bottom V point) */}
        <path d="M 38 90 L 30 130 C 26 150, 32 170, 45 184 L 100 236 L 155 184 C 168 170, 174 150, 170 130 L 162 90" />

        {/* Owl Eyes (Large dual circles) */}
        <circle cx="68" cy="128" r="22" />
        <circle cx="132" cy="128" r="22" />

        {/* Small Triangle Beak */}
        <polygon points="93,140 107,140 100,152" fill="#FFFFFF" stroke="none" />
      </g>

      {/* Owl Pupils (Solid White dots) */}
      <circle cx="68" cy="128" r="8" fill="#FFFFFF" />
      <circle cx="132" cy="128" r="8" fill="#FFFFFF" />
    </svg>
  );

  // Card Variant (Exact reproduction of the uploaded official brand asset)
  if (variant === 'card') {
    return (
      <div
        onClick={onClick}
        className={`bg-[#FF6600] text-white p-6 rounded-3xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-5 select-none ${className} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 p-1 flex items-center justify-center">
          <OwlSvg strokeWidth={11} fill="#FF6600" />
        </div>
        <div className="leading-tight">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
            Academia
          </h2>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Valencia
          </h2>
        </div>
      </div>
    );
  }

  // Icon only
  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`${iconSizeMap[size]} bg-[#FF6600] p-1.5 flex items-center justify-center text-white shadow-md shadow-orange-500/25 shrink-0 select-none ${className} ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="w-full h-full flex items-center justify-center p-0.5">
          <OwlSvg strokeWidth={12} fill="#FF6600" />
        </div>
      </div>
    );
  }

  // Badge only (Icon + inline text in a pill)
  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 bg-[#FF6600]/10 dark:bg-[#FF6600]/20 border border-[#FF6600]/30 px-3 py-1.5 rounded-full ${className} ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="w-5 h-5 rounded-full bg-[#FF6600] p-1 flex items-center justify-center text-white shadow-xs">
          <OwlSvg strokeWidth={14} fill="#FF6600" />
        </div>
        <span className="text-xs font-bold text-[#FF6600] dark:text-orange-400">
          Academia Valencia
        </span>
      </div>
    );
  }

  // Default: Horizontal brand (Official Logo Badge + Typography)
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${className} ${onClick ? 'cursor-pointer group' : ''}`}
    >
      {/* Official Orange Mascot Icon */}
      <div className={`${iconSizeMap[size]} bg-[#FF6600] p-1.5 flex items-center justify-center text-white shadow-md shadow-orange-500/25 shrink-0 transition-transform ${onClick ? 'group-hover:scale-105' : ''}`}>
        <div className="w-full h-full flex items-center justify-center p-0.5">
          <OwlSvg strokeWidth={12} fill="#FF6600" />
        </div>
      </div>

      {/* Typography */}
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <h1 className={`${titleSizeMap[size]} tracking-tight text-slate-900 dark:text-slate-100 font-sans`}>
            Academia <span className="text-[#FF6600] font-black">Valencia</span>
          </h1>
        </div>
        {showSubtitle && (
          <p className={`${subtitleSizeMap[size]} font-medium text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md`}>
            {subtitleText}
          </p>
        )}
      </div>
    </div>
  );
};
