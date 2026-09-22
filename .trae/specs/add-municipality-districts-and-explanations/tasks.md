# Tasks

- [x] Task 1: 扩充题库数据与题型口径
  - [x] SubTask 1.1: 在 `src/data/divisions.js` 新增 `MUNICIPALITIES` 数组，录入 4 个直辖市及其市辖区 —— 北京市 16 个、天津市 16 个、上海市 16 个、重庆市 26 个（重庆只收市辖区，排除城口县、丰都县、垫江县、忠县、云阳县、奉节县、巫山县、巫溪县 8 个县和石柱、秀山、酉阳、彭水 4 个自治县）
  - [x] SubTask 1.2: 在 `divisions.js` 新增题型范围常量（`SCOPE_DIVISION` / `SCOPE_DISTRICT` / `SCOPE_ALL`）、带 `scope` 字段的聚合导出 `DIVISION_UNITS`(333) 与 `DISTRICT_UNITS`(74)、以及按名称反查的 `UNIT_INDEX`（Map: 名称 -> { province, scope }），并导出 `TOTAL_DISTRICTS`
  - [x] SubTask 1.3: 修复 `divisionKind()`，让以「区」结尾的名称返回「市辖区」（判断顺序：自治州 → 地区 → 盟 → 区 → 默认地级市）
  - [x] SubTask 1.4: 用 node 脚本校验：直辖市市辖区共 74 条、重庆 26 条、全局 407 个名称无重复、`UNIT_INDEX` 能反查到全部 407 条

- [x] Task 2: 出题逻辑支持两种题型与范围选择
  - [x] SubTask 2.1: 重构 `src/lib/quiz.js` 的 `createQuestion({ scope, provinceName, answer })`：按 `scope` 选择候选池（division / district / all），`all` 时按两个池的条数自然加权
  - [x] SubTask 2.2: 修改 `pickDistractors`，干扰项只在同一 `scope` 的池内抽取，保持「优先同类别 + 尽量来自不同上级行政区」的既有策略
  - [x] SubTask 2.3: 改造 `explain(unit)` 按 `scope` 生成文案：地级行政区沿用原文案，市辖区生成「{名}是{直辖市}下辖的市辖区。」
  - [x] SubTask 2.4: 新增 `questionPrompt(question)` 或在题目对象上提供题干文案，按 `scope` 输出「下列哪个地级行政区属于{X}」/「下列哪个市辖区属于{X}」，供 QuizView 直接渲染
  - [x] SubTask 2.5: `createQuestion` 返回的题目对象新增 `scope` 与 `promptKind` 字段（`'地级行政区'` / `'市辖区'`）
  - [x] SubTask 2.6: 在 `src/lib/storage.js` 的 `loadSettings()` 中为 `scope` 提供默认值 `'all'`
  - [x] SubTask 2.7: 在 `src/App.jsx` 的 `start()` 与 `next()` 中把 `settings.scope` 传给 `createQuestion`

- [x] Task 3: 首页新增出题范围开关并更新口径文案
  - [x] SubTask 3.1: 在 `src/components/SetupView.jsx` 的「每题限时」区块上方新增「出题范围」分段控件（地级行政区 / 两者混合 / 直辖市市辖区），复用现有 `.seg` 样式，默认「两者混合」
  - [x] SubTask 3.2: 更新首页口径文案，同时说明 27 个省级行政区 333 个地级行政区与 4 个直辖市 74 个市辖区，并把原 note 改为说明香港、澳门特别行政区未纳入
  - [x] SubTask 3.3: 确认范围选择通过 `onSettingsChange` 持久化，且限时挑战模式与练习模式共用同一设置

- [x] Task 4: 答题反馈改为绿/红双条解析
  - [x] SubTask 4.1: 在 `src/components/QuizView.jsx` 中把题干改为读取 `question.promptKind`，渲染「下列哪个{promptKind}属于{province}」
  - [x] SubTask 4.2: 重构反馈块：用一个解析条目列表替代单行 `feedback-body`。答对 / 超时时只渲染正确项（绿），答错时渲染正确项（绿）在前、用户所选错误项（红）在后
  - [x] SubTask 4.3: 每个解析条目渲染 ✓ / ✗ 图标、行政区名（加粗、用对应色）与解析文案
  - [x] SubTask 4.4: 在 `src/styles.css` 中新增 `.explain-list` / `.explain-item` / `.explain-item.ok` / `.explain-item.bad` 样式：白底、圆角、左侧 3px 绿或红竖条、图标与名称同色、条目之间留 8px 间距；保证在绿底（`.feedback.ok`）与红底（`.feedback.bad`）上对比度都足够
  - [x] SubTask 4.5: 确认「已加入错题本」提示、`下一题` 按钮、键盘 Enter / A–D 交互不受影响

- [x] Task 5: 错题本与统计页支持直辖市题目
  - [x] SubTask 5.1: `src/components/WrongBookView.jsx` 依赖修复后的 `divisionKind()`，确认「海淀区」显示为「市辖区」
  - [x] SubTask 5.2: 调整错题重刷逻辑：改为传 `correctName` 给 `createQuestion`，由 `UNIT_INDEX` 内部反查 `province` 与 `scope`（不使用错题记录中的冗余字段，保证旧数据兼容）
  - [x] SubTask 5.3: 修改 `src/components/StatsView.jsx`，分组列表遍历 `PROVINCES` + `MUNICIPALITIES` 合并后的集合，使 4 个直辖市能出现在统计中
  - [x] SubTask 5.4: 确认错题本 key（`province + division`）在两类题型下都不会碰撞

- [x] Task 6: 构建与浏览器端验证
  - [x] SubTask 6.1: 运行 `npm run build` 确认无编译错误
  - [x] SubTask 6.2: 启动 `npm run dev`，用浏览器验证首页范围开关的三档切换与刷新后保持
  - [x] SubTask 6.3: 浏览器验证「仅直辖市市辖区」模式下题干与 4 个选项全部为市辖区、解析文案为「...下辖的市辖区。」
  - [x] SubTask 6.4: 浏览器验证答错时反馈区出现绿 + 红两条解析，答对与超时时只有绿的一条，且未选中的干扰项没有解析
  - [x] SubTask 6.5: 浏览器验证直辖市错题能进入错题本、标签显示「市辖区」、重刷能恢复为市辖区题、答对后自动移出
  - [x] SubTask 6.6: 浏览器验证统计页出现直辖市分组（实测出现「重庆市 0/2 · 0%」「上海市 1/1 · 100%」，北京市与天津市因尚未答过其题目故未显示，符合 `answered > 0` 的过滤规则）
  - [x] SubTask 6.7: 收集控制台 error / warning，确认无新增报错

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 2（需要 `scope` 与 `explain`）
- Task 5 依赖 Task 1（`UNIT_INDEX`）、Task 2（`createQuestion` 的 `scope` 参数）
- Task 6 依赖 Task 1–5 全部完成

# 可并行说明

- Task 1 完成后，Task 2 为唯一阻塞点；Task 4、Task 5 在 Task 2 完成前可先改样式与数据读取部分，但改动建议在 Task 2 落地后统一进行以避免返工
- Task 3 与 Task 5 之间无依赖，可并行