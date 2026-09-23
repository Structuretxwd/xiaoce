import {
  PROVINCES,
  TOTAL_DIVISIONS,
  MUNICIPALITIES,
  TOTAL_DISTRICTS,
  SCOPE_DIVISION,
  SCOPE_DISTRICT,
  SCOPE_ALL,
} from '../data/divisions.js'

const TIME_OPTIONS = [
  { value: 0, label: '不限时' },
  { value: 20, label: '20 秒' },
  { value: 30, label: '30 秒' },
]

const SCOPE_OPTIONS = [
  { value: SCOPE_DIVISION, label: '地级行政区' },
  { value: SCOPE_ALL, label: '两者混合' },
  { value: SCOPE_DISTRICT, label: '直辖市市辖区' },
]

const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

export default function SetupView({ stats, wrongCount, settings, onSettingsChange, onStart }) {
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : null

  return (
    <div className="view">
      <section className="intro">
        <p className="eyebrow">单选题训练</p>
        <h1>选出属于指定省级行政区的地级行政区或市辖区</h1>
        <p className="lede">
          题库覆盖 {PROVINCES.length} 个省级行政区的 {TOTAL_DIVISIONS} 个地级行政区，以及{' '}
          {MUNICIPALITIES.length} 个直辖市的 {TOTAL_DISTRICTS} 个市辖区。
        </p>
        <p className="note">
          香港、澳门特别行政区不设地级行政区与市辖区，未纳入题库。
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>出题范围</h2>
          <div className="seg" role="group" aria-label="出题范围">
            {SCOPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={settings.scope === o.value ? 'on' : ''}
                onClick={() => onSettingsChange({ ...settings, scope: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <p className="note">「两者混合」时，地级行政区与直辖市市辖区题目会按题库规模混出。</p>
        <div className="panel-head">
          <h2>每题限时</h2>
          <div className="seg" role="group" aria-label="每题限时">
            {TIME_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={settings.seconds === o.value ? 'on' : ''}
                onClick={() => onSettingsChange({ ...settings, seconds: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <p className="note">超时按答错计，并同样进入错题本。</p>
        <div className="panel-head">
          <h2>外观</h2>
          <div className="seg" role="group" aria-label="外观">
            {THEME_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={settings.theme === o.value ? 'on' : ''}
                onClick={() => onSettingsChange({ ...settings, theme: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <p className="note">深色模式适合夜间练习；「跟随系统」会随操作系统的深浅色自动切换。</p>
        <div className="actions">
          <button className="primary" type="button" onClick={() => onStart('practice')}>
            开始练习
          </button>
          <button className="secondary" type="button" onClick={() => onStart('challenge')}>
            限时挑战 60 秒
          </button>
        </div>
        {wrongCount > 0 && (
          <button className="textlink" type="button" onClick={() => onStart('wrong')}>
            重刷 {wrongCount} 道错题 →
          </button>
        )}
      </section>

      <section className="metrics">
        <Metric value={stats.answered} label="已答" />
        <Metric value={accuracy === null ? '—' : `${accuracy}%`} label="正确率" />
        <Metric value={stats.bestStreak} label="最佳连对" />
        <Metric value={stats.bestChallenge} label="挑战纪录" />
      </section>
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="metric">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}