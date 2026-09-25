import { divisionKind } from '../data/divisions.js'
import { explainParts } from '../lib/quiz.js'

export default function WrongBookView({ wrongBook, onRepractice, onClear }) {
  if (!wrongBook.length) {
    return (
      <div className="view">
        <section className="intro">
          <p className="eyebrow">错题本</p>
          <h1>还没有错题</h1>
          <p className="lede">答错或超时的题目会自动收录在这里，重刷答对后自动移出。</p>
        </section>
      </div>
    )
  }

  return (
    <div className="view">
      <section className="intro">
        <p className="eyebrow">错题本</p>
        <h1>{wrongBook.length} 道待攻克</h1>
        <p className="lede">答错或超时的题目会自动收录，重刷答对后自动移出。</p>
      </section>

      <div className="actions">
        <button className="primary" type="button" onClick={onRepractice}>
          重刷全部错题
        </button>
        <button
          className="secondary"
          type="button"
          onClick={() => {
            if (window.confirm(`确定清空错题本中的 ${wrongBook.length} 道题吗？`)) onClear()
          }}
        >
          清空错题本
        </button>
      </div>

      {/* 解析直接展开，省掉逐条点击；错选项依赖作答时留下的记录，超时作答只有正确项 */}
      <ul className="review">
        {wrongBook.map((e) => {
          const kind = divisionKind(e.division)
          const right = explainParts({ name: e.division, province: e.province })
          const wrong = e.picked ? explainParts(e.picked) : null
          return (
            <li className="review-item" key={`${e.province}-${e.division}`}>
              <p className="review-head">
                <span>
                  下列哪个{kind}属于<b>{e.province}</b>
                </span>
                <span className="review-count">错 {e.wrongCount} 次</span>
              </p>
              <ul className="explain-list">
                <li className="explain-item ok">
                  <span className="explain-icon" aria-hidden="true">✓</span>
                  <span className="explain-text">
                    <b>{right.name}</b>{right.tail}
                  </span>
                </li>
                {wrong && (
                  <li className="explain-item bad">
                    <span className="explain-icon" aria-hidden="true">✗</span>
                    <span className="explain-text">
                      <b>{wrong.name}</b>{wrong.tail}
                    </span>
                  </li>
                )}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}