import React from 'react';

interface AmbientBacklightProps {
  intensity?: 'high' | 'medium' | 'subtle';
  className?: string;
  showGrid?: boolean;
  showLightning?: boolean;
}

export const AmbientBacklight: React.FC<AmbientBacklightProps> = ({
  intensity = 'high',
  className = '',
  showGrid = true,
  showLightning = true,
}) => {
  const opacityMultiplier =
    intensity === 'high' ? 'opacity-100' : intensity === 'medium' ? 'opacity-75' : 'opacity-50';

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* Base Obsidian Foundation */}
      <div className="absolute inset-0 bg-[#060b17]" />

      {/* Atmospheric Lightning Flashes */}
      {showLightning && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 via-sky-500/10 to-transparent mix-blend-screen pointer-events-none animate-lightning-flash" />
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-fuchsia-500/10 to-transparent mix-blend-screen pointer-events-none animate-lightning-flash-delayed" />
        </>
      )}

      {/* Multi-Colour Lighting from Backside */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${opacityMultiplier}`}>
        {/* Volumetric Rotating Conical Light Beams (Shoots radiant light shafts across the background) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vw] max-w-[1800px] max-h-[1800px] rounded-full light-ray-conic blur-3xl opacity-75 animate-light-ray-rotate mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[1500px] max-h-[1500px] rounded-full light-ray-conic blur-2xl opacity-60 animate-light-ray-reverse mix-blend-color-dodge" />

        {/* Glow 1: Top-Left Radiant Electric Cyan & Neon Sky */}
        <div className="absolute -top-[18%] -left-[12%] w-[720px] h-[720px] rounded-full bg-gradient-to-br from-cyan-400/40 via-sky-500/25 to-blue-600/5 blur-[100px] animate-backlight-float-1" />

        {/* Glow 2: Top-Right Vivid Neon Violet, Purple & Magenta */}
        <div className="absolute -top-[15%] -right-[10%] w-[750px] h-[750px] rounded-full bg-gradient-to-bl from-fuchsia-500/35 via-purple-600/30 to-indigo-700/5 blur-[110px] animate-backlight-float-2" />

        {/* Glow 3: Center-Right Intense Electric Amber & Hot Rose */}
        <div className="absolute top-[35%] -right-[12%] w-[620px] h-[620px] rounded-full bg-gradient-to-l from-rose-500/30 via-pink-500/25 to-amber-500/10 blur-[110px] animate-backlight-float-3" />

        {/* Glow 4: Center-Left Radiant Emerald & Neon Mint Aura */}
        <div className="absolute top-[40%] -left-[10%] w-[640px] h-[640px] rounded-full bg-gradient-to-r from-emerald-400/30 via-teal-400/25 to-cyan-500/10 blur-[110px] animate-backlight-float-4" />

        {/* Glow 5: Central Backside Illumination (illuminates directly from behind cards) */}
        <div className="absolute top-[20%] left-[15%] right-[15%] h-[550px] rounded-full bg-gradient-to-b from-blue-500/30 via-indigo-500/25 to-purple-600/20 blur-[120px] animate-backlight-pulse" />

        {/* Glow 6: Bottom Sapphire Blue & Turquoise Horizon */}
        <div className="absolute -bottom-[20%] left-[10%] right-[10%] h-[600px] rounded-full bg-gradient-to-t from-blue-600/35 via-cyan-500/25 to-transparent blur-[120px] animate-backlight-float-1" />

        {/* Angular Light Shafts (Volumetric searchlights) */}
        <div className="absolute -top-[30%] left-[35%] w-[180px] h-[160vh] bg-gradient-to-b from-cyan-300/20 via-sky-400/10 to-transparent transform -rotate-45 blur-2xl pointer-events-none mix-blend-screen" />
        <div className="absolute -top-[30%] right-[30%] w-[200px] h-[160vh] bg-gradient-to-b from-fuchsia-400/20 via-purple-500/10 to-transparent transform rotate-45 blur-2xl pointer-events-none mix-blend-screen" />
      </div>

      {/* Electric Lightning Arcs (SVG Procedural Lightning Rays) */}
      {showLightning && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-85"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="lightningGlow1" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur1" />
              <feGaussianBlur stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="lightningGlow2" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feGaussianBlur stdDeviation="12" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Electric Cyan/Sky Lightning Discharge (Top-Left to Center) */}
          <path
            d="M -10 40 L 160 85 L 240 140 L 295 125 L 380 210 L 460 230 L 510 320 L 580 340 L 670 450 L 730 460 L 820 540"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lightningGlow1)"
            className="animate-lightning-arc-1"
          />
          {/* Branch 1 */}
          <path
            d="M 295 125 L 340 180 L 390 195 L 430 270"
            fill="none"
            stroke="#a5f3fc"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lightningGlow1)"
            className="animate-lightning-arc-1 opacity-70"
          />

          {/* Electric Purple/Magenta Lightning Discharge (Top-Right to Center) */}
          <path
            d="M 1460 30 L 1320 95 L 1240 135 L 1200 220 L 1110 240 L 1040 330 L 980 360 L 910 440 L 850 470 L 760 560"
            fill="none"
            stroke="#c084fc"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lightningGlow2)"
            className="animate-lightning-arc-2"
          />
          {/* Branch 2 */}
          <path
            d="M 1200 220 L 1150 290 L 1090 310 L 1050 390"
            fill="none"
            stroke="#f0abfc"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lightningGlow2)"
            className="animate-lightning-arc-2 opacity-75"
          />

          {/* Center Electric Spark Grounding Arc */}
          <path
            d="M 640 0 L 680 80 L 660 140 L 720 220 L 700 280 L 750 360"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#lightningGlow1)"
            className="animate-lightning-arc-1 opacity-60"
          />
        </svg>
      )}

      {/* Modern High-Tech Grid with illumination mask */}
      {showGrid && (
        <div className="absolute inset-0 bg-backlight-grid opacity-45 mix-blend-screen" />
      )}

      {/* Subtle Vignette Framing */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
    </div>
  );
};
