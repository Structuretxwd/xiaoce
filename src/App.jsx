import { useCallback, useEffect, useRef, useState } from 'react'
import { createQuestion } from './lib/quiz.js'
import * as store from './lib/storage.js'
import SetupView from './components/SetupView.jsx'
import QuizView from './components/QuizView.jsx'
import ResultView from './components/ResultView.jsx'
import WrongBookView from './components/WrongBookView.jsx'
import StatsView from './components/StatsView.jsx'

const CHALLENGE_SECONDS = 60

export default function App() {
  // 刷新或误关页面后，从未结束的会话继续作答
  const [boot] = useState(() => {
    const saved = store.loadSession()
    return { session: saved, view: saved ? 'quiz' : 'setup' }
  })

  const [view, setView] = useState(boot.view)
  const [stats, setStats] = useState(store.loadStats)
  const [wrongBook, setWrongBook] = useState(store.loadWrongBook)
  const [settings, setSettings] = useState(store.loadSettings)
  const [session, setSession] = useState(boot.session)
  const [isRecord, setIsRecord] = useState(false)

  // 同一题只允许计分一次（超时与点击可能落在同一帧）
  const answeredRef = useRef(boot.session ? boot.session.answered !== null : false)
  // 供计时器读取最新状态，避免闭包读到旧的 session
  const sessionRef = useRef(null)
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => { store.saveStats(stats) }, [stats])
  useEffect(() => { store.saveWrongBook(wrongBook) }, [wrongBook])
  useEffect(() => { store.saveSettings(settings) }, [settings])

  // 进行中的会话落盘；一轮结束后清掉，下次进来仍是首页
  useEffect(() => {
    if (session && !session.finished) store.saveSession(session)
    else store.clearSession()
  }, [session])

  // 主题：跟随系统时监听系统深浅色切换
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved =
        settings.theme === 'system' ? (mq.matches ? 'dark' : 'light') : settings.theme
      document.documentElement.dataset.theme = resolved
    }
    apply()
    if (settings.theme !== 'system') return undefined
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])

  const start = useCallback(
    (mode) => {
      let pool = []
      if (mode === 'wrong') {
        pool = [...wrongBook].sort(
          (a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt - a.lastWrongAt
        )
        if (!pool.length) return
      }
      const head = pool[0]
      answeredRef.current = false
      setIsRecord(false)
      setSession({
        mode,
        question: head
          ? createQuestion({ correctName: head.division })
          : createQuestion({ scope: settings.scope }),
        pool: pool.slice(1),
        total: mode === 'wrong' ? pool.length : null,
        index: 1,
        correct: 0,
        wrong: 0,
        streak: 0,
        bestStreak: 0,
        misses: [],
        answered: null,
        timeLeft: settings.seconds,
        timeLimit: settings.seconds,
        challengeLeft: CHALLENGE_SECONDS,
        finished: false,
      })
      setView('quiz')
    },
    [wrongBook, settings.seconds, settings.scope]
  )

  const answer = useCallback((picked) => {
    const cur = sessionRef.current
    if (answeredRef.current || !cur || cur.finished) return
    answeredRef.current = true

    const isCorrect = picked === cur.question.answerIndex
    const streak = isCorrect ? cur.streak + 1 : 0
    const { province, correct } = cur.question
    // 超时没有选项可指向，只有真正点选才记下错选项
    const pickedUnit = typeof picked === 'number' ? cur.question.options[picked] : null

    setSession({
      ...cur,
      answered: picked,
      correct: cur.correct + (isCorrect ? 1 : 0),
      wrong: cur.wrong + (isCorrect ? 0 : 1),
      streak,
      bestStreak: Math.max(cur.bestStreak || 0, streak),
      // 记下答错 / 超时的题，供结算页复盘
      misses: isCorrect
        ? cur.misses
        : [
            ...cur.misses,
            {
              province,
              promptKind: cur.question.promptKind,
              correct,
              picked: pickedUnit,
            },
          ],
    })
    setStats((st) => store.recordAnswer(st, { province, division: correct.name, isCorrect, streak }))
    setWrongBook((wb) =>
      isCorrect
        ? store.removeFromWrongBook(wb, { province, division: correct.name })
        : store.addToWrongBook(wb, { province, division: correct.name, picked: pickedUnit })
    )
  }, [])

  const finish = useCallback(() => {
    setSession((p) => (p ? { ...p, finished: true } : p))
  }, [])

  const next = useCallback(() => {
    const cur = sessionRef.current
    if (!cur) return
    answeredRef.current = false
    const base = { ...cur, index: cur.index + 1, answered: null, timeLeft: settings.seconds }
    if (cur.mode === 'wrong') {
      const [head, ...rest] = cur.pool
      if (!head) {
        finish()
        return
      }
      setSession({
        ...base,
        pool: rest,
        question: createQuestion({ correctName: head.division }),
      })
      return
    }
    setSession({ ...base, question: createQuestion({ scope: settings.scope }) })
  }, [settings.seconds, settings.scope, finish])

  const quit = useCallback(() => {
    setSession(null)
    setView('setup')
  }, [])

  const exportData = useCallback(() => {
    const json = JSON.stringify(store.buildBackup({ stats, wrongBook, settings }), null, 2)
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `行政区划刷题-备份-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [stats, wrongBook, settings])

  const importData = useCallback((text) => {
    const data = store.parseBackup(text)
    if (!data) {
      window.alert('这个文件无法识别，请选择由本站「导出备份」生成的 JSON 文件。')
      return
    }
    if (!window.confirm('导入会覆盖当前的统计、错题本与设置，确定继续吗？')) return
    if (data.stats) setStats(data.stats)
    if (data.wrongBook) setWrongBook(data.wrongBook)
    if (data.settings) setSettings(data.settings)
  }, [])

  // 每题倒计时（练习 / 错题重刷）
  useEffect(() => {
    if (view !== 'quiz' || !session || session.mode === 'challenge' || session.finished) return
    if (!settings.seconds || answeredRef.current) return
    if (session.timeLeft <= 0) {
      answer('timeout')
      return
    }
    const t = setTimeout(() => setSession((p) => (p ? { ...p, timeLeft: p.timeLeft - 1 } : p)), 1000)
    return () => clearTimeout(t)
  })

  // 限时挑战：总倒计时
  useEffect(() => {
    if (view !== 'quiz' || !session || session.mode !== 'challenge' || session.finished) return
    if (session.challengeLeft <= 0) {
      finish()
      return
    }
    const t = setTimeout(
      () => setSession((p) => (p ? { ...p, challengeLeft: p.challengeLeft - 1 } : p)),
      1000
    )
    return () => clearTimeout(t)
  })

  // 限时挑战：答完自动推进（答错时多留一会儿，让解析能看清）
  useEffect(() => {
    if (!session || session.mode !== 'challenge' || session.finished || session.answered === null) return
    const isCorrect = session.answered === session.question.answerIndex
    const t = setTimeout(next, isCorrect ? 420 : 2000)
    return () => clearTimeout(t)
  }, [session?.answered, session?.question, session?.mode, session?.finished, next, session])

  // 收尾
  useEffect(() => {
    if (view !== 'quiz' || !session?.finished) return
    if (session.mode === 'challenge') {
      setIsRecord(session.correct > stats.bestChallenge)
      setStats((st) => ({ ...st, bestChallenge: Math.max(st.bestChallenge, session.correct) }))
    }
    setView('result')
  }, [view, session, stats.bestChallenge])

  const inPlay = view === 'quiz'

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" type="button" onClick={quit}>
          <span className="brand-mark">地</span>
          <span className="brand-name">行政区划刷题</span>
        </button>
        {inPlay ? (
          <button className="ghost" type="button" onClick={finish}>结束本次</button>
        ) : (
          <nav className="nav">
            <button className={view === 'setup' ? 'on' : ''} type="button" onClick={() => setView('setup')}>
              练习
            </button>
            <button className={view === 'wrong' ? 'on' : ''} type="button" onClick={() => setView('wrong')}>
              错题本{flawBadge(wrongBook.length)}
            </button>
            <button className={view === 'stats' ? 'on' : ''} type="button" onClick={() => setView('stats')}>
              数据
            </button>
          </nav>
        )}
      </header>

      <main className="stage">
        {view === 'setup' && (
          <SetupView
            stats={stats}
            wrongCount={wrongBook.length}
            settings={settings}
            onSettingsChange={setSettings}
            onStart={start}
          />
        )}

        {view === 'quiz' && session && (
          <QuizView session={session} onAnswer={answer} onNext={next} />
        )}

        {view === 'result' && session && (
          <ResultView
            session={session}
            isRecord={isRecord}
            wrongCount={wrongBook.length}
            onAgain={() => start(session.mode)}
            onHome={quit}
          />
        )}

        {view === 'wrong' && (
          <WrongBookView
            wrongBook={wrongBook}
            onRepractice={() => start('wrong')}
            onClear={() => { store.clearWrongBook(); setWrongBook([]) }}
          />
        )}

        {view === 'stats' && (
          <StatsView
            stats={stats}
            onReset={() => setStats(store.emptyStats())}
            onExport={exportData}
            onImport={importData}
          />
        )}
      </main>
    </div>
  )
}

function flawBadge(n) {
  return n ? <span className="badge">{n}</span> : null
}