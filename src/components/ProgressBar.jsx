export default function ProgressBar({ value, goal, color }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const over = goal > 0 && value > goal

  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{
          width: `${pct}%`,
          background: over ? '#E24B4A' : color,
        }}
      />
    </div>
  )
}
