import { PROVINCES, MUNICIPALITIES } from '../data/divisions.js'

export default function StatsView({ stats, onReset }) {
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0

  const rows = [...PROVINCES, ...MUNICIPALITIES].map((p) => ({
    name: p.name,
    ...(stats.byProvince[p.name] || { answered: 0, correct: 0 }),
  }))
    .filter((r) => r.answered > 0)
    .sort((a, b) => b.answered - a.answered)

  return (
    <div className="view">
      <section className="intro">
        <p className="eyebrow">数据</p>
        <h1>累计 {stats.answered} 题</h1>
        <p className="lede">统计保存在本机浏览器，清除浏览器数据会一并清空。</p>
      </section>

      <section className="metrics">
        <div className="metric">
          <b>{stats.answered}</b>
          <span>已答</span>
        </div>
        <div className="metric">
          <b>{accuracy}%</b>
          <span>正确率</span>
        </div>
        <div className="metric">
          <b>{stats.bestStreak}</b>
          <span>最佳连对</span>
        </div>
        <div className="metric">
          <b>{stats.bestChallenge}</b>
          <span>挑战纪录</span>
        </div>
      </section>

      {rows.length > 0 && (
        <section className="breakdown">
          <h2>按上级行政区</h2>
          <ul className="rows">
            {rows.map((r) => {
              const pct = Math.round((r.correct / r.answered) * 100)
              return (
                <li key={r.name}>
                  <span className="row-main">{r.name}</span>
                  <span className="row-bar">
                    <i style={{ width: `${pct}%` }} />
                  </span>
                  <span className="row-count">
                    {r.correct}/{r.answered} · {pct}%
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {stats.answered > 0 && (
        <div className="actions">
          <button
            className="secondary"
            type="button"
            onClick={() => {
              if (window.confirm('确定清零所有答题统计吗？错题本不受影响。')) onReset()
            }}
          >
            清零统计
          </button>
        </div>
      )}
    </div>
  )
}