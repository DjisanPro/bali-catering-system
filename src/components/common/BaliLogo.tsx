import React from 'react';

interface BaliLogoProps {
  variant?: 'full' | 'mark' | 'horizontal' | 'white-text';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BaliLogo: React.FC<BaliLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  // Size mappings
  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return { height: 'h-7', width: 'w-auto', iconSize: 'w-7 h-7' };
      case 'sm':
        return { height: 'h-9', width: 'w-auto', iconSize: 'w-9 h-9' };
      case 'md':
        return { height: 'h-12', width: 'w-auto', iconSize: 'w-12 h-12' };
      case 'lg':
        return { height: 'h-16', width: 'w-auto', iconSize: 'w-16 h-16' };
      case 'xl':
        return { height: 'h-24', width: 'w-auto', iconSize: 'w-24 h-24' };
      default:
        return { height: 'h-12', width: 'w-auto', iconSize: 'w-12 h-12' };
    }
  };

  const { height, iconSize } = getSizeStyles();

  // If only the iconic Cloche Dish Cover mark is requested
  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 200 160"
        className={`${iconSize} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Bali Catering Service Cloche Icon"
      >
        {/* Top Knob */}
        <circle cx="100" cy="18" r="9" fill="#F27D26" />
        <path d="M96 24 H104 V32 H96 Z" fill="#F27D26" />

        {/* Cloche Dome */}
        <path
          d="M24 130 C24 64, 60 30, 100 30 C140 30, 176 64, 176 130 Z"
          fill="#F27D26"
        />

        {/* Fork (Left) */}
        <g fill="#FFFFFF">
          {/* Tines */}
          <path d="M60 62 L63 60 L68 76 L66 77 Z" />
          <path d="M66 57 L69 55 L73 72 L71 73 Z" />
          <path d="M72 53 L75 51 L78 68 L76 69 Z" />
          <path d="M78 50 L81 48 L83 64 L81 65 Z" />
          {/* Fork Head & Neck */}
          <path d="M64 74 C66 78, 79 73, 79 66 L82 72 C80 80, 68 84, 64 78 Z" />
          {/* Handle */}
          <path d="M66 77 L48 122 L42 120 L61 75 Z" />
        </g>

        {/* Spoon (Center) */}
        <g fill="#FFFFFF">
          {/* Spoon Bowl */}
          <ellipse
            cx="103"
            cy="70"
            rx="12"
            ry="18"
            transform="rotate(26 103 70)"
          />
          {/* Handle */}
          <path d="M96 82 L77 125 L71 122 L91 80 Z" />
        </g>

        {/* Knife (Right) */}
        <g fill="#FFFFFF">
          {/* Blade */}
          <path
            d="M138 52 C146 64, 137 84, 128 92 L121 88 C131 75, 132 60, 138 52 Z"
            fillRule="evenodd"
          />
          {/* Handle */}
          <path d="M125 90 L108 126 L103 124 L120 87 Z" />
        </g>

        {/* Bottom Serving Tray / Base */}
        <rect x="18" y="136" width="164" height="11" rx="5.5" fill="#F27D26" />
      </svg>
    );
  }

  // Horizontal variant (Mark on left, Typography on right)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <svg
          viewBox="0 0 200 160"
          className={iconSize}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Knob */}
          <circle cx="100" cy="18" r="9" fill="#F27D26" />
          <path d="M96 24 H104 V32 H96 Z" fill="#F27D26" />

          {/* Cloche Dome */}
          <path
            d="M24 130 C24 64, 60 30, 100 30 C140 30, 176 64, 176 130 Z"
            fill="#F27D26"
          />

          {/* Fork */}
          <g fill="#FFFFFF">
            <path d="M60 62 L63 60 L68 76 L66 77 Z" />
            <path d="M66 57 L69 55 L73 72 L71 73 Z" />
            <path d="M72 53 L75 51 L78 68 L76 69 Z" />
            <path d="M78 50 L81 48 L83 64 L81 65 Z" />
            <path d="M64 74 C66 78, 79 73, 79 66 L82 72 C80 80, 68 84, 64 78 Z" />
            <path d="M66 77 L48 122 L42 120 L61 75 Z" />
          </g>

          {/* Spoon */}
          <g fill="#FFFFFF">
            <ellipse
              cx="103"
              cy="70"
              rx="12"
              ry="18"
              transform="rotate(26 103 70)"
            />
            <path d="M96 82 L77 125 L71 122 L91 80 Z" />
          </g>

          {/* Knife */}
          <g fill="#FFFFFF">
            <path
              d="M138 52 C146 64, 137 84, 128 92 L121 88 C131 75, 132 60, 138 52 Z"
              fillRule="evenodd"
            />
            <path d="M125 90 L108 126 L103 124 L120 87 Z" />
          </g>

          {/* Tray */}
          <rect x="18" y="136" width="164" height="11" rx="5.5" fill="#F27D26" />
        </svg>

        <div className="flex flex-col">
          <div className="flex items-center">
            {/* Custom Orange 'B' */}
            <span className="text-[#F27D26] font-extrabold text-2xl font-serif leading-none italic -mr-0.5">
              B
            </span>
            {/* Dark oval 'a' */}
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs mx-0.5">
              a
            </span>
            {/* 'li' */}
            <span className="text-slate-900 font-extrabold text-2xl tracking-tight leading-none">
              li
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 font-heading">
            Catering Service
          </span>
        </div>
      </div>
    );
  }

  // Full stacked official logo (identical to uploaded IMG-20241106-WA0035.jpg)
  const isWhiteText = variant === 'white-text';

  return (
    <svg
      viewBox="0 0 240 260"
      className={`${height} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bali Catering Service Logo"
    >
      {/* 1. CLOCHE & UTENSILS */}
      {/* Top Knob */}
      <circle cx="120" cy="22" r="10" fill="#F27D26" />
      <path d="M116 28 H124 V36 H116 Z" fill="#F27D26" />

      {/* Cloche Dome */}
      <path
        d="M40 136 C40 68, 78 35, 120 35 C162 35, 200 68, 200 136 Z"
        fill="#F27D26"
      />

      {/* Fork (Left) */}
      <g fill="#FFFFFF">
        <path d="M78 68 L81 66 L86 82 L84 83 Z" />
        <path d="M84 63 L87 61 L91 78 L89 79 Z" />
        <path d="M90 59 L93 57 L96 74 L94 75 Z" />
        <path d="M96 56 L99 54 L101 70 L99 71 Z" />
        <path d="M82 80 C84 84, 97 79, 97 72 L100 78 C98 86, 86 90, 82 84 Z" />
        <path d="M84 83 L66 128 L60 126 L79 81 Z" />
      </g>

      {/* Spoon (Center) */}
      <g fill="#FFFFFF">
        <ellipse
          cx="123"
          cy="76"
          rx="12.5"
          ry="19"
          transform="rotate(26 123 76)"
        />
        <path d="M116 88 L97 131 L91 128 L111 86 Z" />
      </g>

      {/* Knife (Right) */}
      <g fill="#FFFFFF">
        <path
          d="M158 58 C166 70, 157 90, 148 98 L141 94 C151 81, 152 66, 158 58 Z"
          fillRule="evenodd"
        />
        <path d="M145 96 L128 132 L123 130 L140 93 Z" />
      </g>

      {/* Tray Base */}
      <rect x="34" y="142" width="172" height="11" rx="5.5" fill="#F27D26" />

      {/* 2. "Bali" LOGOTYPE */}
      {/* Orange Calligraphic 'B' */}
      <g>
        {/* Top brush flourish */}
        <path
          d="M28 174 C40 162, 60 156, 76 160 C64 167, 54 172, 42 176 Z"
          fill="#F27D26"
        />
        {/* Main curved B body */}
        <path
          d="M48 168 C68 158, 88 166, 88 180 C88 190, 80 196, 70 198 C84 200, 94 212, 88 226 C82 238, 62 240, 52 236 C42 232, 48 218, 54 214 C64 218, 76 220, 78 214 C80 206, 72 202, 62 202 L54 202 C50 194, 52 184, 54 176 C64 174, 76 174, 76 182 C76 186, 72 188, 66 188 L58 188 C54 180, 50 174, 48 168 Z"
          fill="#F27D26"
        />
      </g>

      {/* Black oval with white 'a' */}
      <g>
        <ellipse cx="114" cy="205" rx="19" ry="20" fill={isWhiteText ? '#FFFFFF' : '#0F172A'} />
        {/* White / Inverted 'a' */}
        <text
          x="114"
          y="213"
          fill={isWhiteText ? '#0F172A' : '#FFFFFF'}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="24"
          textAnchor="middle"
        >
          a
        </text>
      </g>

      {/* Black bold 'l' */}
      <rect
        x="142"
        y="166"
        width="15"
        height="58"
        rx="5"
        fill={isWhiteText ? '#FFFFFF' : '#0F172A'}
      />

      {/* Black bold 'i' */}
      <rect
        x="166"
        y="182"
        width="15"
        height="42"
        rx="5"
        fill={isWhiteText ? '#FFFFFF' : '#0F172A'}
      />
      <ellipse
        cx="173.5"
        cy="170"
        rx="8"
        ry="7.5"
        fill={isWhiteText ? '#FFFFFF' : '#0F172A'}
      />

      {/* 3. "Catering Service" SUB-HEAD */}
      <text
        x="120"
        y="254"
        fill={isWhiteText ? '#E2E8F0' : '#0F172A'}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        fontSize="17"
        letterSpacing="2.5"
        textAnchor="middle"
      >
        Catering Service
      </text>
    </svg>
  );
};
