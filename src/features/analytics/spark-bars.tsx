interface SparkBarsProps {
  values: number[];
  labels?: string[];
  className?: string;
}

export const SparkBars = ({ values, labels, className }: SparkBarsProps) => {
  const max = Math.max(1, ...values);
  const width = 320;
  const height = 80;
  const gap = 2;
  const barWidth = values.length
    ? (width - gap * (values.length - 1)) / values.length
    : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Sparkline chart"
    >
      {values.map((value, index) => {
        const barHeight = (value / max) * (height - 4);
        const x = index * (barWidth + gap);
        const y = height - barHeight;
        return (
          <rect
            key={labels?.[index] ?? index}
            x={x}
            y={y}
            width={Math.max(1, barWidth)}
            height={barHeight}
            className="fill-accent"
          >
            <title>
              {labels?.[index] ?? String(index)}: {value}
            </title>
          </rect>
        );
      })}
    </svg>
  );
};
