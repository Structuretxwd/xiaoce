import { SCOPE_ALL } from '../data/divisions.js'

const STATS_KEY = 'xiaoce.stats.v1'
const WRONG_KEY = 'xiaoce.wrong.v1'
const SETTINGS_KEY = 'xiaoce.settings.v1'
const SESSION_KEY = 'xiaoce.session.v1'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 隐私模式下写入失败时静默降级，不影响本次答题 */
  }
}

export function emptyStats() {
  return { answered: 0, correct: 0, bestStreak: 0, bestChallenge: 0, byProvince: {} }
}

export function loadStats() {
  return { ...emptyStats(), ...read(STATS_KEY, {}) }
}

export function saveStats(stats) {
  write(STATS_KEY, stats)
}

export function loadWrongBook() {
  const list = read(WRONG_KEY, [])
  return Array.isArray(list) ? list : []
}

export function saveWrongBook(list) {
  write(WRONG_KEY, list)
}

export function loadSettings() {
  return { seconds: 30, scope: SCOPE_ALL, theme: 'system', ...read(SETTINGS_KEY, {}) }
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, settings)
}

/** 读取未结束的会话，用于刷新后继续作答；已结束或数据缺失时返回 null。 */
export function loadSession() {
  const s = read(SESSION_KEY, null)
  if (!s || !s.question || s.finished || !Array.isArray(s.misses)) return null
  return s
}

export function saveSession(session) {
  write(SESSION_KEY, session)
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* 忽略隐私模式下的失败 */
  }
}

export function buildBackup({ stats, wrongBook, settings }) {
  return { app: '行政区划刷题', version: 1, exportedAt: Date.now(), stats, wrongBook, settings }
}

/**
 * 解析备份文件，只接受本站导出的结构；返回可直接落库的三份数据，
 * 无法识别时返回 null。
 */
export function parseBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null

  const stats = data.stats && typeof data.stats === 'object' ? { ...emptyStats(), ...data.stats } : null
  const wrongBook = Array.isArray(data.wrongBook) ? data.wrongBook : null
  const settings = data.settings && typeof data.settings === 'object' ? { ...loadSettings(), ...data.settings } : null

  if (!stats && !wrongBook && !settings) return null
  return { stats, wrongBook, settings }
}

/** 记录一次作答结果，返回新的统计对象。 */
export function recordAnswer(stats, { province, isCorrect, streak }) {
  const prev = stats.byProvince[province] || { answered: 0, correct: 0 }
  return {
    ...stats,
    answered: stats.answered + 1,
    correct: stats.correct + (isCorrect ? 1 : 0),
    bestStreak: Math.max(stats.bestStreak, streak),
    byProvince: {
      ...stats.byProvince,
      [province]: {
        answered: prev.answered + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
      },
    },
  }
}

export function addToWrongBook(list, { province, division }) {
  const hit = list.find((e) => e.province === province && e.division === division)
  if (hit) {
    return list.map((e) =>
      e === hit ? { ...e, wrongCount: e.wrongCount + 1, lastWrongAt: Date.now() } : e
    )
  }
  return [...list, { province, division, wrongCount: 1, lastWrongAt: Date.now() }]
}

export function removeFromWrongBook(list, { province, division }) {
  return list.filter((e) => !(e.province === province && e.division === division))
}

export function clearWrongBook() {
  write(WRONG_KEY, [])
}