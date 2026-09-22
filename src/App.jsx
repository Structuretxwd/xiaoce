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
  const [view, setView] = useState('setup')
  const [stats, setStats] = useState(store.loadStats)
  const [wrongBook, setWrongBook] = useState(store.loadWrongBook)
  const [settings, setSettings] = useState(store.loadSettings)
  const [session, setSession] = useState(null)
  const [isRecord, setIsRecord] = useState(false)

  // 同一题只允许计分一次（超时与点击可能落在同一帧）
  const answeredRef = useRef(false)
  // 供计时器读取最新状态，避免闭包读到旧的 session
  const sessionRef = useRef(null)
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => { store.saveStats(stats) }, [stats])
  useEffect(() => { store.saveWrongBook(wrongBook) }, [wrongBook])
  useEffect(() => { store.saveSettings(settings) }, [settings])

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

    setSession({
      ...cur,
      answered: picked,
      correct: cur.correct + (isCorrect ? 1 : 0),
      wrong: cur.wrong + (isCorrect ? 0 : 1),
      streak,
    })
    setStats((st) => store.recordAnswer(st, { province, isCorrect, streak }))
    setWrongBook((wb) =>
      isCorrect
        ? store.removeFromWrongBook(wb, { province, division: correct.name })
        : store.addToWrongBook(wb, { province, division: correct.name })
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

  // 限时挑战：答完自动推进
  useEffect(() => {
    if (!session || session.mode !== 'challenge' || session.finished || session.answered === null) return
    const isCorrect = session.answered === session.question.answerIndex
    const t = setTimeout(next, isCorrect ? 420 : 950)
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

        {view === 'stats' && <StatsView stats={stats} onReset={() => setStats(store.emptyStats())} />}
      </main>
    </div>
  )
}

function flawBadge(n) {
  return n ? <span className="badge">{n}</span> : null
}