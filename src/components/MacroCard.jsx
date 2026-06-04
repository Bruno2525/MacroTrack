export default function MacroCard({ label, value, goal, color, unit = 'g' }) {
  return (
    <div className="macro-card">
      <div className="macro-card-label" style={{ color }}>
        {label}
      </div>
      <div className="macro-card-value" style={{ color }}>
        {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}
        <span className="macro-card-unit">{unit}</span>
      </div>
      <div className="macro-card-goal">meta {goal}{unit}</div>
    </div>
  )
}
