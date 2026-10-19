'use client';
import React from 'react';
import Bus from './Bus';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Animated road scene for the hero: layered hills and palms scroll past
 * (parallax speeds), the road markings rush by, and an Easy Travel coach
 * drives in the middle. Mouse position comes from CSS variables set by the
 * Hero (--mx / --my in [-1, 1]); layers shift by their depth (--d).
 */

// Tiles are 1600x170 and repeat seamlessly (paths start and end at the same y).
const FAR_HILLS =
  'M0 170 V110 C120 70 240 60 360 95 S600 130 760 85 S1040 40 1200 90 S1460 120 1600 110 V170 Z';
const MID_HILLS =
  'M0 170 V135 C160 115 280 105 420 125 S700 150 860 120 S1180 100 1320 128 S1520 140 1600 135 V170 Z';

const Palm: React.FC<{ x: number; h?: number }> = ({ x, h = 78 }) => {
  const top = 170 - h;
  return (
    <g>
      <path d={`M${x} 170 Q${x + 6} ${top + h / 2} ${x + 12} ${top}`} stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      {[
        `M${x + 12} ${top} q-22 -6 -36 10`,
        `M${x + 12} ${top} q-14 -18 -30 -16`,
        `M${x + 12} ${top} q4 -22 22 -22`,
        `M${x + 12} ${top} q22 -8 34 6`,
        `M${x + 12} ${top} q18 4 26 22`,
      ].map((d, i) => (
        <path key={i} d={d} stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
};

const House: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <rect x={x} y="140" width="34" height="30" fill="currentColor" opacity="0.7" />
    <path d={`M${x - 4} 142 L${x + 17} 124 L${x + 38} 142 Z`} fill="currentColor" />
    <rect x={x + 13} y="152" width="8" height="18" fill="#fafaf7" opacity="0.5" />
  </g>
);

const Sign: React.FC<{ x: number; label: string; km: number }> = ({ x, label, km }) => (
  <g>
    <rect x={x + 30} y="128" width="4" height="42" fill="#78907f" />
    <rect x={x} y="104" width="64" height="28" rx="4" fill="#0d4035" />
    <rect x={x + 2} y="106" width="60" height="24" rx="3" fill="none" stroke="#ffffff" strokeOpacity="0.6" />
    <text x={x + 32} y="117" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffffff" fontFamily="Inter, system-ui, sans-serif">
      {label}
    </text>
    <text x={x + 32} y="127" textAnchor="middle" fontSize="8" fill="#13ec5b" fontFamily="Inter, system-ui, sans-serif">
      {km} km
    </text>
  </g>
);

const NearTile: React.FC = () => (
  <svg viewBox="0 0 1600 170" className="h-full w-auto shrink-0" aria-hidden>
    <g className="text-[#2c6b47] dark:text-[#1f5a3c]">
      <Palm x={110} />
      <Palm x={150} h={60} />
      <House x={330} />
      <Palm x={560} h={88} />
      <Palm x={1010} />
      <House x={1150} />
      <House x={1196} />
      <Palm x={1420} h={66} />
    </g>
    <Sign x={760} label="Yaoundé" km={240} />
    <Sign x={1280} label="Kribi" km={160} />
  </svg>
);

const HillsTile: React.FC<{ path: string; className: string }> = ({ path, className }) => (
  <svg viewBox="0 0 1600 170" className={`h-full w-auto shrink-0 ${className}`} aria-hidden preserveAspectRatio="none">
    <path d={path} fill="currentColor" />
  </svg>
);

/** Three copies + translate(-33.33%) = seamless infinite scroll. */
const Strip: React.FC<{ speed: string; children: React.ReactNode }> = ({ speed, children }) => (
  <div className="scene-scroll flex h-full w-max" style={{ ['--dur' as string]: speed }}>
    {children}
    {children}
    {children}
  </div>
);

// Deterministic 7x7 pattern for the decorative QR code.
const QR_BITS = '1110111100100111101011010110110101111010011001110111001011101010110101101';

const MiniQr: React.FC = () => (
  <div className="grid grid-cols-7 gap-[2px] p-1.5 rounded-md bg-white ring-1 ring-ink-100">
    {Array.from({ length: 49 }, (_, i) => (
      <span key={i} className={`size-[5px] rounded-[1px] ${QR_BITS[i] === '1' ? 'bg-ink-900' : 'bg-transparent'}`} />
    ))}
  </div>
);

const HeroScene: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative h-[250px] md:h-[380px] w-full overflow-hidden select-none" aria-hidden>
      {/* sun */}
      <div className="plx absolute right-[14%] top-6 md:top-10" style={{ ['--d' as string]: '-10' }}>
        <div className="size-16 md:size-24 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 opacity-80 dark:opacity-40 blur-[1px] shadow-[0_0_80px_30px_rgba(253,186,116,0.35)]" />
      </div>

      {/* far hills */}
      <div className="plx absolute inset-x-0 bottom-[128px] md:bottom-[164px] h-[90px] md:h-[130px]" style={{ ['--d' as string]: '-8' }}>
        <Strip speed="140s">
          <HillsTile path={FAR_HILLS} className="text-[#cfe9d6] dark:text-[#123122]" />
        </Strip>
      </div>

      {/* mid hills */}
      <div className="plx absolute inset-x-0 bottom-[128px] md:bottom-[164px] h-[70px] md:h-[100px]" style={{ ['--d' as string]: '-16' }}>
        <Strip speed="80s">
          <HillsTile path={MID_HILLS} className="text-[#a9d9b6] dark:text-[#16402b]" />
        </Strip>
      </div>

      {/* palms, houses, road signs */}
      <div className="plx absolute inset-x-0 bottom-[124px] md:bottom-[160px] h-[80px] md:h-[120px]" style={{ ['--d' as string]: '-24' }}>
        <Strip speed="34s">
          <NearTile />
        </Strip>
      </div>

      {/* ground + road */}
      <div className="absolute inset-x-0 bottom-0 h-[128px] md:h-[164px] bg-[#d7ecd9] dark:bg-[#0f2a1c]" />
      <div className="absolute inset-x-0 bottom-[88px] md:bottom-[112px] h-10 md:h-[52px] bg-ink-800 dark:bg-[#0b1710] shadow-[inset_0_2px_0_rgba(255,255,255,0.08)]">
        <div className="absolute inset-x-0 top-1 h-[2px] bg-white/25" />
        <div className="absolute inset-x-0 bottom-1 h-[2px] bg-white/25" />
        <div className="road-dash absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px]" />
      </div>

      {/* the bus follows the cursor horizontally and leans with its speed */}
      <div className="absolute left-1/2 bottom-[96px] md:bottom-[122px] -translate-x-1/2 z-10">
        <div className="bus-follow">
          <Bus beam className="w-[220px] md:w-[360px] drop-shadow-xl" />
        </div>
      </div>

      {/* floating travel cards (desktop) */}
      <div className="hidden lg:block">
        {/* boarding pass */}
        <div className="plx absolute left-[3%] xl:left-[6%] top-6 z-20" style={{ ['--d' as string]: '22' }}>
          <div className="float-y" style={{ animationDelay: '-1.5s' }}>
            <div className="relative w-[270px] -rotate-6 rounded-2xl bg-white dark:bg-surface-dark shadow-elevated ring-1 ring-ink-100 dark:ring-white/10 overflow-hidden">
              <div className="flex items-center justify-between bg-teal-accent px-4 py-2 text-white">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">{t('hero.scene.ticket')}</span>
                <span className="material-symbols-outlined text-[16px] text-primary">directions_bus</span>
              </div>
              <div className="flex items-center gap-3 px-4 pt-3">
                <div className="flex-1">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="font-display text-xl font-semibold text-text-main dark:text-white leading-none">DLA</div>
                      <div className="text-[10px] text-text-muted mt-1">08:30</div>
                    </div>
                    <div className="flex-1 mx-2 mb-2 border-t-2 border-dashed border-ink-200 dark:border-white/20 relative">
                      <span className="material-symbols-outlined absolute left-1/2 -translate-x-1/2 -top-[11px] text-[18px] text-teal-accent dark:text-primary bg-white dark:bg-surface-dark px-0.5">
                        directions_bus
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-semibold text-text-main dark:text-white leading-none">YDE</div>
                      <div className="text-[10px] text-text-muted mt-1">12:15</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* perforation */}
              <div className="relative my-3 border-t border-dashed border-ink-200 dark:border-white/15">
                <span className="absolute -left-2 -top-2 size-4 rounded-full bg-background-light dark:bg-background-dark" />
                <span className="absolute -right-2 -top-2 size-4 rounded-full bg-background-light dark:bg-background-dark" />
              </div>
              <div className="flex items-center justify-between px-4 pb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">{t('hero.scene.seat')}</div>
                  <div className="font-display text-lg font-semibold text-text-main dark:text-white">12A</div>
                </div>
                <MiniQr />
              </div>
            </div>
          </div>
        </div>

        {/* live trip tracker */}
        <div className="plx absolute right-[3%] xl:right-[6%] top-2 z-20" style={{ ['--d' as string]: '30' }}>
          <div className="float-y">
            <div className="w-[290px] rotate-3 rounded-2xl bg-white/90 dark:bg-surface-dark/90 backdrop-blur shadow-elevated ring-1 ring-ink-100 dark:ring-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-text-main dark:text-white">
                  <span className="relative flex size-2">
                    <span className="absolute inset-0 rounded-full bg-primary animate-ping" />
                    <span className="relative size-2 rounded-full bg-primary" />
                  </span>
                  {t('hero.scene.live')}
                </span>
                <span className="text-[10px] font-medium text-teal-accent dark:text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {t('hero.scene.ontime')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-medium text-text-muted mb-1.5">
                <span>Douala</span>
                <span>Yaoundé</span>
              </div>
              <div className="relative h-6">
                <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-ink-200 dark:border-white/20" />
                <div className="ride-progress absolute inset-y-0 left-1 flex items-center">
                  <div className="h-[3px] w-full rounded-full bg-primary" />
                </div>
                <span className="absolute left-0 top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-teal-accent dark:bg-primary" />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 size-2.5 rounded-full ring-2 ring-teal-accent dark:ring-primary bg-white dark:bg-surface-dark" />
                <span className="ride-bus absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-6 rounded-full bg-teal-accent text-white flex items-center justify-center shadow-card">
                  <span className="material-symbols-outlined text-[14px]">directions_bus</span>
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-text-muted">{t('hero.scene.arrival')}</span>
                <span className="font-semibold text-text-main dark:text-white tabular-nums">12:15</span>
              </div>
            </div>
          </div>
        </div>

        {/* payment chip */}
        <div className="plx absolute left-[30%] xl:left-[31%] top-[24px] z-20" style={{ ['--d' as string]: '40' }}>
          <div className="float-y" style={{ animationDelay: '-3s' }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-surface-dark shadow-card ring-1 ring-ink-100 dark:ring-white/10 pl-1.5 pr-3 py-1.5">
              <span className="size-6 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px] text-text-main">check</span>
              </span>
              <span className="text-[11px] font-semibold text-text-main dark:text-white">{t('hero.scene.paid')}</span>
              <span className="text-[11px] text-text-muted tabular-nums">6 500 FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroScene;
