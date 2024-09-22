const fs = require('fs')
const util = require('util')

const readFile = util.promisify(fs.readFile)

const log = s => console.log(JSON.stringify(s, null, 2))

const encode = state => {
  const { data: { board, tegoma } } = state
  const pick = (board, type) => board.flatMap((row, i) => row.flatMap((cell, j) => Math.abs(cell) === 8 ? [[cell, i, j]] : []))
  const k = pick(board, 8)
  const d = pick(board, 17)
  const r = pick(board, 7)
  const h = pick(board, 16)
  const b = pick(board, 6)
  const t = pick(board, 14)
  const o = pick(board, 13)
  const m = pick(board, 12)
  const q = pick(board, 11)
  const g = pick(board, 5)
  const s = pick(board, 4)
  const n = pick(board, 3)
  const l = pick(board, 2)
  const p = pick(board, 1)
}

module.exports = decode