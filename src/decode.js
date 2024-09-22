const fs = require('fs')
const util = require('util')

const readFile = util.promisify(fs.readFile)

const log = s => console.log(JSON.stringify(s, null, 2))

const factMemo = {}
const fact = n => factMemo[n] || n <= 1 && (factMemo[n] = 1) || (factMemo[n] = fact(n - 1) * n)

const factBMemo = {}
const factB = n => factBMemo[n] || n <= 1 && (factBMemo[n] = 1n) || (factBMemo[n] = factB(n - 1) * BigInt(n))

const combinBMemo = {}
const combinB = (x, y) => {
  if (combinBMemo[`${x}_${y}`]) return combinBMemo[`${x}_${y}`]
  combinBMemo[`${x}_${y}`] = factB(x) / factB(y) / factB(x - y)
  return combinBMemo[`${x}_${y}`]
}

const pad2 = s => String(s).padStart(2, '0')

const initiate = async () => {
  const allBoardPatterns = await readFile(`./output/allBoardPatterns/summary.json`).then(JSON.parse)
  let id = null
  while (id === null || id >= String(allBoardPatterns.value)) {
    id = [...Array(String(allBoardPatterns.value).length)].map(() => Math.floor(Math.random() * 10)).join('') 
  }
  return { id: [id, allBoardPatterns.value], data: { allBoardPatterns } }
}

const attachOneWayPieceKey = async state => {
  const { id: [id, mass], data: { allBoardPatterns } } = state
  const { key: k1, value, position } = allBoardPatterns.children.find(({ position }) => BigInt(position) >= BigInt(id))
  return { id: [String(BigInt(id) - (BigInt(position) - BigInt(value))), value], data: { allBoardPatterns, keys: [k1] } }
}

const attachTwoWayPieceKey = async state => {
  const { id: [id, mass], data: { keys: [k1], ...data } } = state
  const allBoardPattern = await readFile(`./output/allBoardPatterns/${k1}.json`).then(JSON.parse)
  const { key: k2, value, position } = allBoardPattern.find(({ position }) => BigInt(position) >= BigInt(id))
  return { id: [String(BigInt(id) - (BigInt(position) - BigInt(value))), value], data: { ...data, keys: [k1, k2] } }
}

const attachPieceCounts = async state => {
  const { id, data: { keys: [k1, k2], ...data } } = state
  const [p, l, n, s, g, q, m, o, t, b, r, h, d] = [
    k1.slice(1, 3),
    ...k1.slice(3).split(''),
    ...k2.slice(0, 2).split(''),
    k2.slice(2, 4),
    ...k2.slice(4).split(''),
  ].map(Number)
  return { id, data: { ...data, keys: [k1, k2], pieces: [[p, l, n], [s, g, q, m, o, t, b, r, h, d]] } }
}

const parseOneWayPiecePatterns = async (state, oneWayBoardPatterns, oneWayColumnPatterns, i) => {
  const { id: [id, mass], data: { keys: [k1, k2], board, ...data } } = state
  if (i < 8) {
    const { key: columnKey, value: v, position: p } = oneWayBoardPatterns[8 - i][k1].children.find(({ position }) => BigInt(position) >= id)
    const [p1, l1, n1] = [k1.slice(1, 3), ...k1.slice(3).split('')]
    const [p2, l2, n2] = [columnKey.slice(1, 3), ...columnKey.slice(3).split('')]
    const nextKey = `$${pad2(p1 - p2)}${l1 - l2}${n1 - n2}`
    const nextMass = BigInt(oneWayBoardPatterns[8 - i - 1]?.[nextKey]?.value || 1)
    const nextId = (BigInt(id) - (BigInt(p) - BigInt(v) * nextMass)) % nextMass
    const columnPatternId = nextId * BigInt(oneWayColumnPatterns[columnKey].length) / nextMass
    return {
      id: [String(nextId), String(nextMass)],
      data: {
        ...data,
        keys: [nextKey, k2],
        board: [...board || [], oneWayColumnPatterns[columnKey][String(columnPatternId)].split('').map(i => Number(i) - 3)],
      },
    }
  } else {
    return {
      id: ['0', '0'],
      data: {
        ...data,
        keys: ['$0000', k2],
        board: [...board || [], oneWayColumnPatterns[k1][id].split('').map(i => Number(i) - 3)],
      },
    }
  }
}

/*
const combinPattern = (id, x, y) => {
  if (y === 1) {
    return [Number(id)]
  }
  const { head, nextId } = Object.keys([...Array(x - y + 1)]).map(Number).reduce(({ sum, head, nextId }, i) => {
    if (head != null) return { sum, head, nextId }
    const diff = combinB(x - i - 1, y - 1)
    const newSum = sum + diff
    if (newSum > id) {
      return { sum: newSum, head: i, nextId: id - (sum || BigInt(0)) }
    }
    return { sum: newSum, head, nextId }
  }, { sum: BigInt(0) })
  return [head, ...combinPattern(nextId, x - head - 1, y - 1).map(i => i + head + 1)]
}
*/

const combinPattern = (id, x, y) =>
  Object.keys([...Array(y)]).map(Number).reduce(({ acc, id, x, y }, i) => {
    if (y === 1) {
      return { acc: [...acc, (acc.length ? acc.slice(-1)[0] + 1 : 0) + Number(id)] }
    }
    const { tail, nextId } = Object.keys([...Array(x - y + 1)]).map(Number).reduce(({ sum, tail, nextId }, i) => {
      if (tail != null) return { sum, tail, nextId }
      const diff = combinB(x - i - 1, y - 1)
      const newSum = sum + diff
      if (newSum > id) {
        return { sum: newSum, tail: i, nextId: id - (sum || BigInt(0)) }
      }
      return { sum: newSum, tail, nextId }
    }, { sum: BigInt(0) })
    return {
      acc: [...acc, (acc.length ? acc.slice(-1)[0] + 1 : 0) + tail],
      id: nextId,
      x: x - tail - 1,
      y: y - 1,
    }
  }, { acc: [], id, x, y }).acc

const putMulti = (state, type, count) => {
  if (!count) return state
  const { id: [id, mass], data: { board, ...data } } = state
  const voids = board.flatMap((row, i) => row.flatMap((cell, j) => cell === 0 ? [[i, j]] : []))

  const mass1 = BigInt(mass) / BigInt((type !== 8) ? (2 ** count) : 2)
  const directionId = BigInt(id) / mass1
  const id1 = BigInt(id) % mass1

  const mass2 = BigInt(mass1) / combinB(voids.length, count)
  const positionId = BigInt(id1) / mass2
  const id2 = BigInt(id1) % mass2

  const direction = (type !== 8)
    ? Number(directionId).toString(2).padStart(count, '0').split('').map(v => v * 2 - 1)
    : ((Number(directionId) % 2) ? [1, -1] : [-1, 1])
  const combinPatterns = combinPattern(positionId, voids.length, count)
  const position = combinPatterns.map(i => voids[i])

  return {
    ...state,
    id: [String(id2), String(mass2)],
    data: {
      ...data,
      board: board.map((row, i) => row.map((cell, j) => position.some(([x, y]) => x === i && y === j) ? direction.shift() * type : cell)),
    },
  }
}

const tegoma = (state, type, count) => {
  const { id: [id, mass], data } = state
  const newMass = BigInt(mass) / BigInt(count + 1)
  const result = BigInt(id) / BigInt(newMass)
  const newId = BigInt(id) % newMass
  return {
    id: [newId, newMass],
    data: {
      ...data,
      tegoma: {
        ...data.tegoma,
        [type]: [
          Number(result),
          count - Number(result),
        ],
      },
    },
  }
}

const parseTwoWayPiecePatterns = async state => {
  const { data: { pieces: [[p, l, n], [s, g, q, m, o, t, b, r, h, d]] } } = state

  state = putMulti(state, 11, q)
  state = tegoma(state, 1, 18 - p - q)

  state = putMulti(state, 12, m)
  state = tegoma(state, 2, 4 - l - m)

  state = putMulti(state, 13, o)
  state = tegoma(state, 3, 4 - n - o)

  state = putMulti(state, 4, s)
  state = putMulti(state, 14, t)
  state = tegoma(state, 4, 4 - s - t)

  state = putMulti(state, 5, g)
  state = tegoma(state, 5, 4 - g)
 
  state = putMulti(state, 6, b)
  state = putMulti(state, 16, h)
  state = tegoma(state, 6, 2 - b - h)

  state = putMulti(state, 7, r)
  state = putMulti(state, 17, d)
  state = tegoma(state, 7, 2 - r - d)

  state = putMulti(state, 8, 2)

  return state
}

const validateByOuteImpl = async board => {
  const blackKingId = -8
  const [x, y] = board.flatMap((row, i) => row.flatMap((cell, j) => cell === blackKingId ? [[i, j]] : []))[0]
  for (let vx = -1; vx <= 1; vx++) {
    for (let vy = -1; vy <= 2; vy++) {
      if (vx === 0 && vy === 0) continue
      if (vx === 0 && vy === 2) continue
      for (let distance = 1; distance < 9; distance++) {
        const [dx, dy] = [x + vx * distance, y + vy * distance]
        if (dx < 0 || dx >= 9 || dy < 0 || dy >= 9) break
        const cell = board[dx][dy]
        if (cell === 0) continue
        if (cell < 0) break
        if (vx === 0 && vy === 1) {
          if ([2, 7, 17].includes(cell)) return false
          if (distance === 1 && [1, 4, 5, 8, 11, 12, 13, 14, 16].includes(cell)) return false
        }
        if (Math.abs(vx) === 1 && vy === 1) {
          if ([6, 16].includes(cell)) return false
          if (distance === 1 && [4, 5, 8, 11, 12, 13, 14, 17].includes(cell)) return false
        }
        if (Math.abs(vx) === 1 && vy === 0) {
          if ([7, 17].includes(cell)) return false
          if (distance === 1 && [5, 8, 11, 12, 13, 14, 16].includes(cell)) return false
        }
        if (Math.abs(vx) === 1 && vy === -1) {
          if ([6, 16].includes(cell)) return false
          if (distance === 1 && [4, 8, 16].includes(cell)) return false
        }
        if (vx === 0 && vy === -1) {
          if ([7, 17].includes(cell)) return false
          if (distance === 1 && [5, 8, 11, 12, 13, 14, 16].includes(cell)) return false
        }
        if (Math.abs(vx) === 1 && vy === 2) {
          if (distance === 1 && [3].includes(cell)) return false
          break
        }
        break
      }
    }
  }
  return true
}

const validateByOute = async state => {
  const { data: { board, ...data } } = state
  return { ...state, data: { ...data, board, isValid: await validateByOuteImpl(board) } }
}

// const lines = ['　', '╵', '╶', '└', '╷', '│', '┌', '├', '╴', '┘', '─', '┴', '┐', '┤', '┬', '┼']

const koma = '　歩香桂銀金角飛玉　　と杏圭全　馬竜'
const arabicNumber = '１２３４５６７８９'
const kanjiNumber = '一二三四五六七八九'
const render = (board, tegoma) => [
  Object.entries(tegoma).map(([k, [v1, v2]]) => `${koma[k]}${v1}`).join(''),
  arabicNumber.split('').reverse().map(v => ` ${v}`).join(''),
  ...Object.keys([...Array(9)]).map(Number).map(i => [
    ...Object.keys([...Array(9)]).map(Number).map(j => (v => (v < 0 ? 'v' : ' ') + koma[Math.abs(v)])(board[j][i])),
    kanjiNumber[i],
  ].join('')),
  Object.entries(tegoma).map(([k, [v1, v2]]) => `${koma[k]}${v2}`).join(''),
].join('\n')

const decode = async () => {
  const oneWayBoardPatterns = await readFile(`./output/oneWayBoardPatterns.json`).then(JSON.parse)
  const oneWayColumnPatterns = await readFile(`./output/oneWayColumnPatterns.json`).then(JSON.parse)
  let state = await initiate()
  state = await attachOneWayPieceKey(state)
  state = await attachTwoWayPieceKey(state)
  state = await attachPieceCounts(state)

  const massRatio = BigInt(state.id[1]) / BigInt(oneWayBoardPatterns[8][state.data.keys[0]].value)

  let state1 = { ...state, id: [String(BigInt(state.id[0]) / massRatio), oneWayBoardPatterns[8][state.data.keys[0]].value] }
  state1 = await Object.keys([...Array(9)]).reduce((a, i) => (
    a.then(a =>
      parseOneWayPiecePatterns(a, oneWayBoardPatterns, oneWayColumnPatterns, Number(i))
    )
  ), Promise.resolve(state1))

  let state2 = { ...state1, id: [String(BigInt(state.id[0]) % massRatio), massRatio] }
  state2 = await parseTwoWayPiecePatterns(state2)

  /*
  const state2 = {
    data: {
      board: [
        [0,0,0,0,7,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,-1,0,0,0,0],
        [0,0,0,0,-8,0,-1,2,2],
        [0,0,0,-1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,3],
        [0,0,0,0,0,0,0,0,0],
        [6,0,0,0,0,0,0,0,0],
      ],
      tegoma: {}
    }
  }
  */

  const state3 = await validateByOute(state2)
  const { isValid, board, tegoma } = state3.data

  console.log('-----')
  console.log(`判定結果: ${isValid ? 'O' : 'X'}`)
  console.log('-----')
  console.log(render(board, tegoma))
  console.log('-----')

  return state3
}

module.exports = decode