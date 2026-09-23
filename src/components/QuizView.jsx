import { useEffect } from 'react'
import { explainParts, MODE_LABEL } from '../lib/quiz.js'

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizView({ session, onAnswer, onNext }) {
  const { question, answered, mode, index, correct, wrong, streak, total } = session
  const locked = answered !== null
  const isCorrect = answered === question.answerIndex
  const timedOut = answered === 'timeout'
  const limit = session.timeLimit
  const timed = mode !== 'challenge' && limit > 0
  const secondsLeft = mode === 'challenge' ? session.challengeLeft : session.timeLeft
  const urgent = !locked && secondsLeft <= 5
  const parts = explainParts(question.correct)
  const showWrong = isCorrect === false && typeof answered === 'number'
  const wrongParts = showWrong ? explainParts(question.options[answered]) : null
  // 限时挑战里答对只做快速确认，答错则完整展示解析，避免刷完一轮什么都没记住
  const showFeedback = locked && (mode !== 'challenge' || !isCorrect)

  useEffect(() => {
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toUpperCase()
      const byLetter = LETTERS.indexOf(key)
      const byNumber = /^[1-4]$/.test(key) ? Number(key) - 1 : -1
      const pick = byLetter >= 0 ? byLetter : byNumber

      if (!locked) {
        if (pick >= 0 && pick < question.options.length) {
          e.preventDefault()
          onAnswer(pick)
        }
        return
      }
      if (mode === 'challenge' && !showWrong) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [locked, mode, question, onAnswer, onNext, showWrong])

  return (
    <div className="view quiz">
      <div className="quizbar">
        <span className="tag">{MODE_LABEL[mode]}</span>
        <span className="stat">
          第 {index}
          {total ? ` / ${total}` : ''} 题
        </span>
        <span className="stat">对 {correct}</span>
        <span className="stat">错 {wrong}</span>
        <span className="grow" />
        {streak >= 3 && <span className="streak">连对 {streak}</span>}
        <span className={`clock${urgent ? ' urgent' : ''}`}>
          {secondsLeft}
          <i>s</i>
        </span>
      </div>

      {timed && (
        <div className="timer" key={index}>
          <div
            className={`timer-fill${urgent ? ' urgent' : ''}`}
            style={{ width: `${Math.max(0, (secondsLeft / limit) * 100)}%` }}
          />
        </div>
      )}

      <div className="question" key={`q-${index}`}>
        <h1>
          下列哪个{question.promptKind}属于<span className="prov">{question.province}</span>
        </h1>
      </div>

      <div className="options" key={`o-${index}`}>
        {question.options.map((o, i) => {
          let state = ''
          if (locked) {
            if (i === question.answerIndex) state = ' is-correct'
            else if (i === answered) state = ' is-wrong'
            else state = ' is-dim'
          }
          return (
            <button
              key={o.name}
              type="button"
              className={`option${state}`}
              disabled={locked}
              onClick={() => onAnswer(i)}
            >
              <span className="option-key">{LETTERS[i]}</span>
              <span className="option-text">{o.name}</span>
            </button>
          )
        })}
      </div>

      {showFeedback && (
        <div className={`feedback${isCorrect ? ' ok' : ' bad'}`}>
          <p className="feedback-head">
            {isCorrect
              ? '正确'
              : timedOut
                ? `超时未作答 · 正确答案是 ${question.correct.name}`
                : `答错了 · 正确答案是 ${question.correct.name}`}
          </p>
          <ul className="explain-list">
            <li className="explain-item ok">
              <span className="explain-icon" aria-hidden="true">✓</span>
              <span className="explain-text">
                <b>{parts.name}</b>{parts.tail}
              </span>
            </li>
            {wrongParts && (
              <li className="explain-item bad">
                <span className="explain-icon" aria-hidden="true">✗</span>
                <span className="explain-text">
                  <b>{wrongParts.name}</b>{wrongParts.tail}
                </span>
              </li>
            )}
          </ul>
          {!isCorrect && <p className="feedback-note">已加入错题本</p>}
          <div className="actions">
            <button className="primary" type="button" onClick={onNext}>
              下一题
              <kbd>Enter</kbd>
            </button>
          </div>
        </div>
      )}

      {!locked && (
        <p className="hint">
          按 <kbd>A</kbd>–<kbd>D</kbd> 或 <kbd>1</kbd>–<kbd>4</kbd> 作答
        </p>
      )}
    </div>
  )
}