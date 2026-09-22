import {
  DIVISION_UNITS,
  DISTRICT_UNITS,
  ALL_UNITS,
  UNIT_INDEX,
  SCOPE_DIVISION,
  SCOPE_DISTRICT,
  SCOPE_ALL,
  divisionKind,
} from '../data/divisions.js'

export const MODE_LABEL = {
  practice: '练习模式',
  challenge: '限时挑战',
  wrong: '错题重刷',
}

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function withKind(unit) {
  return { ...unit, kind: divisionKind(unit.name) }
}

/** 按范围取候选池：市辖区 / 地级行政区 / 混合。 */
function poolForScope(scope) {
  if (scope === SCOPE_DISTRICT) return DISTRICT_UNITS
  if (scope === SCOPE_DIVISION) return DIVISION_UNITS
  return ALL_UNITS
}

/** 题干的行政区类别文案，由正确答案的 scope 决定。 */
function promptKindForScope(scope) {
  return scope === SCOPE_DISTRICT ? '市辖区' : '地级行政区'
}

/**
 * 挑选 3 个干扰项，只在同 scope 的池内抽，并排除与正确答案同 province 的条目。
 * 优先选与正确答案同 divisionKind 的（避免市辖区题混入地级市），
 * 优先让干扰项来自不同 province，不够再用剩余条目补齐（此时允许同 province）。
 */
function pickDistractors(pool, correctUnit) {
  const kind = divisionKind(correctUnit.name)
  const sameKind = []
  const otherKind = []

  for (const u of pool) {
    if (u.name === correctUnit.name) continue
    if (u.province === correctUnit.province) continue
    if (divisionKind(u.name) === kind) sameKind.push(u)
    else otherKind.push(u)
  }

  const picked = []
  const usedProvinces = new Set([correctUnit.province])
  const usedNames = new Set([correctUnit.name])

  const push = (u, requireNewProvince) => {
    if (picked.length === 3) return
    if (usedNames.has(u.name)) return
    if (requireNewProvince && usedProvinces.has(u.province)) return
    picked.push(u)
    usedNames.add(u.name)
    usedProvinces.add(u.province)
  }

  for (const u of shuffle(sameKind)) push(u, true)
  if (picked.length < 3) for (const u of shuffle(sameKind)) push(u, false)
  if (picked.length < 3) for (const u of shuffle(otherKind)) push(u, false)

  return picked
}

/**
 * 生成一道题。传了 correctName（错题重刷）时按名称反查该条目，用其自身的
 * scope / province 出题并忽略传入的 scope；否则按 scope 随机抽正确答案。
 */
export function createQuestion({ scope = SCOPE_ALL, correctName } = {}) {
  const found = correctName ? UNIT_INDEX.get(correctName) : null
  const correctUnit = found || pickRandom(poolForScope(scope))
  const correct = withKind(correctUnit)

  const distractors = pickDistractors(poolForScope(correctUnit.scope), correctUnit).map(withKind)
  const options = shuffle([correct, ...distractors])

  return {
    scope: correctUnit.scope,
    promptKind: promptKindForScope(correctUnit.scope),
    province: correctUnit.province,
    correct,
    options,
    answerIndex: options.findIndex((o) => o.name === correct.name),
  }
}

/** 解析分段：name 为行政区名，tail 为「是YYY下辖的市辖区 / 地级市 / 自治州 / 地区 / 盟。」 */
export function explainParts(unit) {
  const kind =
    unit.scope === SCOPE_DISTRICT || divisionKind(unit.name) === '市辖区'
      ? '市辖区'
      : divisionKind(unit.name)
  return { name: unit.name, tail: `是${unit.province}下辖的${kind}。` }
}