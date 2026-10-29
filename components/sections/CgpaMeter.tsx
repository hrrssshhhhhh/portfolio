// Power bar showing CGPA out of max.
export default function CgpaMeter({ value, max }: { value: number; max: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-haze">CGPA</span>
        <span className="font-display text-3xl text-(--bit)">
          {value}
          <span className="text-base text-haze"> / {max}</span>
        </span>
      </div>
      <div
        role="meter"
        aria-label="CGPA"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="mt-3 h-6 -skew-x-12 border-2 border-night bg-night shadow-[4px_4px_0_rgb(0_0_0/0.45)] outline-2 outline-line"
      >
        <div
          className="h-full bg-(--bit) [background-image:repeating-linear-gradient(90deg,transparent_0_18px,rgb(11_8_32/0.35)_18px_21px)]"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}
