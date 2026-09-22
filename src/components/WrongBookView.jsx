import { divisionKind } from '../data/divisions.js'

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

      <ul className="rows">
        {wrongBook.map((e) => (
          <li key={`${e.province}-${e.division}`}>
            <span className="row-main">{e.division}</span>
            <span className="row-sub">{e.province}</span>
            <span className="row-kind">{divisionKind(e.division)}</span>
            <span className="row-count">错 {e.wrongCount} 次</span>
          </li>
        ))}
      </ul>
    </div>
  )
}