import { explainParts, MODE_LABEL } from '../lib/quiz.js'

export default function ResultView({ session, isRecord, wrongCount, onAgain, onHome }) {
  const { mode, correct, wrong, total, misses, bestStreak = 0 } = session
  const missed = misses || []
  const answered = correct + wrong
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0

  const heading =
    mode === 'challenge'
      ? isRecord
        ? '新纪录'
        : '挑战结束'
      : mode === 'wrong'
        ? '错题重刷完成'
        : '本次练习结束'

  const lede =
    mode === 'challenge'
      ? `60 秒内答对 ${correct} 题。`
      : mode === 'wrong'
        ? `重刷 ${total} 道错题，答对的已自动移出错题本。`
        : `本次共作答 ${answered} 题。`

  const canAgain = mode !== 'wrong' || wrongCount > 0

  return (
    <div className="view">
      <section className="intro">
        <p className="eyebrow">{MODE_LABEL[mode]}</p>
        <h1>{heading}</h1>
        <p className="lede">{lede}</p>
      </section>

      <section className="metrics">
        <div className="metric">
          <b>{correct}</b>
          <span>答对</span>
        </div>
        <div className="metric">
          <b>{wrong}</b>
          <span>答错</span>
        </div>
        <div className="metric">
          <b>{accuracy}%</b>
          <span>正确率</span>
        </div>
        {bestStreak > 1 && (
          <div className="metric">
            <b>{bestStreak}</b>
            <span>最高连对</span>
          </div>
        )}
      </section>

      {missed.length > 0 && (
        <section className="breakdown">
          <h2>本轮错题 · {missed.length} 道</h2>
          <ul className="review">
            {missed.map((m, i) => {
              const parts = explainParts(m.correct)
              const wrongParts = m.picked ? explainParts(m.picked) : null
              return (
                <li className="review-item" key={`${m.correct.name}-${i}`}>
                  <p className="review-head">
                    下列哪个{m.promptKind}属于<b>{m.province}</b>
                    <span className="review-pick">
                      {m.picked ? `你选了 ${m.picked.name}` : '超时未作答'}
                    </span>
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
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="actions">
        {canAgain && (
          <button className="primary" type="button" onClick={onAgain}>
            再来一次
          </button>
        )}
        <button className="secondary" type="button" onClick={onHome}>
          返回首页
        </button>
      </div>
    </div>
  )
}