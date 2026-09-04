/** Decorative particle field for the employee detail banner. */
const PARTICLES = [
  { x: 6, y: 18, size: 2, delay: 0, duration: 11, tone: "lime" },
  { x: 14, y: 72, size: 1.5, delay: 1.2, duration: 14, tone: "sky" },
  { x: 22, y: 38, size: 2.5, delay: 0.4, duration: 12, tone: "lime" },
  { x: 31, y: 12, size: 1.5, delay: 2.1, duration: 15, tone: "sky" },
  { x: 38, y: 64, size: 2, delay: 0.8, duration: 13, tone: "lime" },
  { x: 47, y: 28, size: 1.5, delay: 3.0, duration: 16, tone: "sky" },
  { x: 55, y: 78, size: 2, delay: 1.6, duration: 12, tone: "lime" },
  { x: 62, y: 16, size: 3, delay: 0.2, duration: 10, tone: "sky" },
  { x: 69, y: 52, size: 1.5, delay: 2.4, duration: 14, tone: "lime" },
  { x: 76, y: 34, size: 2, delay: 1.0, duration: 13, tone: "sky" },
  { x: 83, y: 68, size: 2.5, delay: 0.6, duration: 11, tone: "lime" },
  { x: 90, y: 22, size: 1.5, delay: 2.8, duration: 15, tone: "sky" },
  { x: 11, y: 48, size: 2, delay: 1.8, duration: 12, tone: "lime" },
  { x: 28, y: 86, size: 1.5, delay: 0.9, duration: 14, tone: "sky" },
  { x: 44, y: 8, size: 2, delay: 2.2, duration: 13, tone: "lime" },
  { x: 58, y: 44, size: 1.5, delay: 1.4, duration: 16, tone: "sky" },
  { x: 72, y: 88, size: 2.5, delay: 0.3, duration: 11, tone: "lime" },
  { x: 86, y: 56, size: 2, delay: 2.6, duration: 12, tone: "sky" },
  { x: 18, y: 24, size: 1.5, delay: 3.2, duration: 15, tone: "lime" },
  { x: 52, y: 70, size: 2, delay: 1.1, duration: 13, tone: "sky" },
  { x: 66, y: 40, size: 1.5, delay: 0.5, duration: 14, tone: "lime" },
  { x: 94, y: 42, size: 2.5, delay: 1.9, duration: 10, tone: "sky" },
  { x: 4, y: 58, size: 2, delay: 2.0, duration: 12, tone: "lime" },
  { x: 40, y: 90, size: 1.5, delay: 0.7, duration: 15, tone: "sky" },
] as const;

export const EmployeeBannerParticles = () => (
  <div className="employee-detail-banner__particles" aria-hidden>
    {PARTICLES.map((particle, index) => (
      <span
        key={index}
        className={`employee-detail-banner__particle employee-detail-banner__particle--${particle.tone}`}
        style={{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          animationDelay: `${particle.delay}s`,
          animationDuration: `${particle.duration}s`,
        }}
      />
    ))}
  </div>
);
