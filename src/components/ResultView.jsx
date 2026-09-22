import { MODE_LABEL } from '../lib/quiz.js'

export default function ResultView({ session, isRecord, wrongCount, onAgain, onHome }) {
  const { mode, correct, wrong, total } = session
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
      </section>

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