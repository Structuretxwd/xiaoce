import { useState } from 'react'
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
  { value: SCOPE_ALL, label: '综合训练' },
  { value: SCOPE_DISTRICT, label: '直辖市市辖区' },
]

const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

// 题库总量：地级行政区 + 直辖市市辖区
const TOTAL_BANK = TOTAL_DIVISIONS + TOTAL_DISTRICTS

export default function SetupView({ stats, wrongCount, settings, onSettingsChange, onStart }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : null
  const mastered = Object.keys(stats.mastered || {}).length
  const coverage = Math.round((mastered / TOTAL_BANK) * 100)
  const limitText = settings.seconds ? `当前限时 ${settings.seconds} 秒，超时算错` : '当前不限时'

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

      {/* 核心区域：只放「出题范围 + 开始」，把纵向空间让给主操作 */}
      <section className="panel">
        <h2>出题范围</h2>
        <div className="seg seg-wide" role="group" aria-label="出题范围">
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

        <div className="actions start-actions">
          <button className="primary primary-lg" type="button" onClick={() => onStart('practice')}>
            开始练习
          </button>
          <button className="secondary mode-cta" type="button" onClick={() => onStart('challenge')}>
            限时挑战
            <span className="count">极速 60s</span>
          </button>
          {wrongCount > 0 && (
            <button className="secondary mode-cta" type="button" onClick={() => onStart('wrong')}>
              重刷错题
              <span className="count">{wrongCount}</span>
            </button>
          )}
        </div>

        <p className="note">
          两种玩法：「开始练习」按每题限时逐题作答（{limitText}）；「限时挑战」是全卷 60
          秒倒计时，答得越快答得越多，答错会停留 2 秒展示解析。
        </p>
        <p className="note">「综合训练」会按题库规模混出地级行政区与直辖市市辖区题目。</p>
      </section>

      <section className="dashboard">
        <Metric value={stats.answered} label="已答" />
        <Metric value={accuracy === null ? '—' : `${accuracy}%`} label="正确率" />
        <Metric value={stats.bestStreak} label="最佳连对" />
        <Metric value={stats.bestChallenge} label="挑战纪录" />
        <div className="dash-progress">
          <p className="dash-progress-head">
            <span>题库覆盖</span>
            <span>
              已掌握 <b>{mastered}</b> / {TOTAL_BANK} 题 · {coverage}%
            </span>
          </p>
          <div className="dash-progress-bar">
            <i style={{ width: `${coverage}%` }} />
          </div>
        </div>
      </section>

      <section className="more">
        <button
          className="more-toggle"
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <span>更多设置</span>
          <span className="more-summary">
            每题{timeLabel(settings.seconds)} · {themeLabel(settings.theme)}
          </span>
          <svg
            className={`more-arrow${moreOpen ? ' open' : ''}`}
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              d="M3.5 6l4.5 4.5L12.5 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {moreOpen && (
          <div className="more-body">
            <div className="more-row">
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

            <div className="more-row">
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
          </div>
        )}
      </section>
    </div>
  )
}

function timeLabel(seconds) {
  return seconds ? `限时 ${seconds} 秒` : '不限时'
}

function themeLabel(theme) {
  return THEME_OPTIONS.find((o) => o.value === theme)?.label ?? '跟随系统'
}

function Metric({ value, label }) {
  return (
    <div className="dash-card">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}