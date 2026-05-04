import { useCallback, useRef } from "react";

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  disabled?: boolean;
}

const SIZE = 240;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const START_ANGLE = 135; // degrees, sweep 270deg
const SWEEP = 270;

export function TempDial({ value, min = 16, max = 30, onChange, onCommit, disabled }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);
  const pct = (value - min) / (max - min);
  const dash = pct * (CIRC * (SWEEP / 360));

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
      // Convert to 0..360 with 0 at right, going clockwise
      deg = (deg + 360) % 360;
      // Our arc starts at 135 (bottom-left) going clockwise to 405 (=45)
      let local = (deg - START_ANGLE + 360) % 360;
      if (local > SWEEP) local = local > (SWEEP + (360 - SWEEP) / 2) ? 0 : SWEEP;
      const ratio = local / SWEEP;
      const next = Math.round(min + ratio * (max - min));
      if (next !== value) onChange(next);
    },
    [min, max, value, onChange],
  );

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromPoint(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    if (e.buttons === 0) return;
    updateFromPoint(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    if (disabled) return;
    onCommit?.(value);
  };

  return (
    <div className="relative grid place-items-center" style={{ width: SIZE, height: SIZE }}>
      <svg
        ref={ref}
        width={SIZE}
        height={SIZE}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: "none", cursor: disabled ? "not-allowed" : "grab" }}
      >
        <defs>
          <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.20 235)" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 165)" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRC * (SWEEP / 360)} ${CIRC}`}
          transform={`rotate(${START_ANGLE} ${SIZE / 2} ${SIZE / 2})`}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={disabled ? "var(--device-off)" : "url(#dialGrad)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRC}`}
          transform={`rotate(${START_ANGLE} ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: "stroke 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-6xl font-bold tabular-nums" style={{ opacity: disabled ? 0.4 : 1 }}>
            {value}°
          </div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
            {disabled ? "Powered off" : "Drag to set"}
          </div>
        </div>
      </div>
    </div>
  );
}
