const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)

const factMemo = {}
const fact = n => factMemo[n] || n <= 1 && (factMemo[n] = 1) || (factMemo[n] = fact(n - 1) * n)

const generateOneWayKomaColumnPatterns1 = () =>
  Object.keys([...Array((2 + 1) * (4 + 1) * (4 + 1))]).reduce((a, i) => {
    const totalfuCount = Math.floor(i / 25)
    const totalKyoCount = Math.floor(i / 5) % 5
    const totalKeiCount = i % 5
    const illegalPatterns = {
      '0': [0, 1, 2, 3],
      '1': [0, 3],
      '7': [0, 3],
      '8': [0, 1, 2, 3],
    }
    return Object.keys([...Array(4 * 2 * 2 * 4)]).reduce((a, j) => {
      const status0 = Math.floor(j / (2 * 2 * 4))
      const status1 = Math.floor(j / (2 * 4)) % 2
      const status7 = Math.floor(j / 4) % 2
      const status8 = j % 4
      const illegalPieces = [
        illegalPatterns[0][status0],
        illegalPatterns[1][status1],
        illegalPatterns[7][status7],
        illegalPatterns[8][status8],
      ].filter(Boolean)
      const illegalFuCount = illegalPieces.filter(k => k === 1).length
      const illegalKyoCount = illegalPieces.filter(k => k === 2).length
      const illegalKeiCount = illegalPieces.filter(k => k === 3).length
      const fuCount = totalfuCount - illegalFuCount
      const kyoCount = totalKyoCount - illegalKyoCount
      const keiCount = totalKeiCount - illegalKeiCount
      if (fuCount >= 0 && kyoCount >= 0 && keiCount >= 0 && 9 - illegalPieces.length - fuCount - kyoCount - keiCount >= 0) {
        return {
          ...a,
          [i]: (a[i] || 0)
            + (-1) ** illegalPieces.length
              * (!illegalFuCount && fuCount ? 2 : 1)
              * 2 ** kyoCount
              * 2 ** keiCount
              * fact(9 - illegalPieces.length) / fact(fuCount) / fact(kyoCount) / fact(keiCount) / fact(9 - illegalPieces.length - fuCount - kyoCount - keiCount),
        }
      }
      return a
    }, a)
  }, {})

const generateOneWayKomaColumnPatterns = () =>
Object.fromEntries(
  Object.entries(
    Object.keys([...Array(4 ** 9)]).reduce((a, i) => {
      if (i % 4 ** 7 === 0) console.log(i / (4 ** 9))
      const key = Number(i).toString(4).padStart(9, '0').split('').map(Number)
      const fuPositions = key.flatMap((value, position) => value === 1 ? [position] : [])
      const kyoPositions = key.flatMap((value, position) => value === 2 ? [position] : [])
      const keiPositions = key.flatMap((value, position) => value === 3 ? [position] : [])
      const fuDirections =
        fuPositions.length === 2 &&
          [[1, -1], [-1, 1]].filter(directions => fuPositions.every((position, i) => directions[i] === 1 && position > 0 || directions[i] === -1 && position < 8)) ||
        fuPositions.length === 1 &&
          [[1], [-1]].filter(directions => fuPositions.every((position, i) => directions[i] === 1 && position > 0 || directions[i] === -1 && position < 8)) ||
        fuPositions.length === 0 && [[]]
      const kyoDirections = kyoPositions.length <= 4 && Object.keys([...Array(2 ** kyoPositions.length)]).flatMap(i => {
        const directions = kyoPositions.length ? Number(i).toString(2).padStart(kyoPositions.length, '0').split('').map(i => i * 2 - 1) : []
        return kyoPositions.every((position, i) => directions[i] === 1 && position > 0 || directions[i] === -1 && position < 8) ? [directions] : []
      })
      const keiDirections = keiPositions.length <= 4 && Object.keys([...Array(2 ** keiPositions.length)]).flatMap(i => {
        const directions = keiPositions.length ? Number(i).toString(2).padStart(keiPositions.length, '0').split('').map(i => i * 2 - 1) : []
        return keiPositions.every((position, i) => directions[i] === 1 && position > 1 || directions[i] === -1 && position < 7) ? [directions] : []
      })
      if (!(fuDirections && kyoDirections && keiDirections)) return a
      const patternKey = fuPositions.length * 25 + kyoPositions.length * 5 + keiPositions.length
      return fuDirections.reduce((a, fuDirection) => (
        kyoDirections.reduce((a, kyoDirection) => (
          keiDirections.reduce((a, keiDirection) => ({
            ...a,
            [patternKey]: [
              ...a[patternKey] || [],
              Object.keys([...Array(9)]).map(Number).map(i =>
                fuPositions.includes(i) && fuDirection[fuPositions.indexOf(i)] * 1
                || kyoPositions.includes(i) && kyoDirection[kyoPositions.indexOf(i)] * 2
                || keiPositions.includes(i) && keiDirection[keiPositions.indexOf(i)] * 3
                || 0
              ).map(n => n + 3).join('')
            ],
          }), a)
        ), a)
      ), a)
    }, {})
  ).map(([k, v]) => [k, v.length])
)

const generateOneWayKomaBoardPatterns = columnPatterns =>
  Object.keys([...Array(8)]).reduce((a1, i1) => [
    ...a1,
    Object.keys([...Array(((Number(i1) + 2) * 2 + 1) * 25)]).reduce((a2, i2) => {
      const totalKey = i2
      const totalFuCount = Math.floor(totalKey / 25)
      const totalKyoCount = Math.floor(totalKey / 5) % 5
      const totalKeiCount = totalKey % 5
      return Object.entries(columnPatterns).reduce((a3, [k3, v3]) => {
        const length = BigInt(v3)
        const fuCount = totalFuCount - Math.floor(k3 / 25)
        const kyoCount = totalKyoCount - Math.floor(k3 / 5) % 5
        const keiCount = totalKeiCount - k3 % 5
        const key = fuCount * 25 + kyoCount * 5 + keiCount
        if (fuCount >= 0 && fuCount <= 18 && kyoCount >= 0 && kyoCount <= 4 && keiCount >= 0 && keiCount <= 4) {
          return { ...a3, [totalKey]: String(BigInt(a3[totalKey] || '0') + BigInt(a1[i1][key] || '0') * BigInt(length)) }
        }
        return a3
      }, a2)
    }, {}),
  ], [columnPatterns])

const factBMemo = {}
const factB = n => factBMemo[n] || n <= 1 && (factBMemo[n] = 1n) || (factBMemo[n] = factB(n - 1) * BigInt(n))

const generateAllKomaBoardPatterns = async boardPatterns => {
  let total = '0'
  await Object.entries(boardPatterns).forEach(async ([key, mass]) => {
    console.log(`key: ${key}`)
    const list = []
    const keyValue = Number(key)
    const fu = Math.floor(keyValue / 25)
    const kyo = Math.floor(keyValue / 5) % 5
    const kei = keyValue % 5
    for (let gin = 0; gin <= 4; gin++) {
      for (let kin = 0; kin <= 4; kin++) {
        for (let to = 0; to <= 18 - fu; to++) {
          for (let narikyo = 0; narikyo <= 4 - kyo; narikyo++) {
            for (let narikei = 0; narikei <= 4 - kei; narikei++) {
              for (let narigin = 0; narigin <= 4 - gin; narigin++) {
                for (let kaku = 0; kaku <= 2; kaku++) {
                  for (let hisha = 0; hisha <= 2; hisha++) {
                    for (let uma = 0; uma <= 2 - kaku; uma++) {
                      for (let ryu = 0; ryu <= 2 - hisha; ryu++) {
                        const senteGyoku = 1
                        const goteGyoku = 1
                        const patterns = BigInt(mass)
                          * factB(81 - fu - kyo - kei)
                          / factB(to) * BigInt(2 ** to * (18 - fu - to + 1))
                          / factB(narikyo) * BigInt(2 ** narikyo * (4 - kyo - narikyo + 1))
                          / factB(narikei) * BigInt(2 ** narikei * (4 - kei - narikei + 1))
                          / (factB(gin) * factB(narigin)) * BigInt(2 ** gin * 2 ** narigin * (4 - gin - narigin + 1))
                          / factB(kin) * BigInt(2 ** kin * (4 - kin + 1))
                          / (factB(kaku) * factB(uma)) * BigInt(2 ** kaku * 2 ** uma * (2 - kaku - uma + 1))
                          / (factB(hisha) * factB(ryu)) * BigInt(2 ** hisha * 2 ** ryu * (2 - hisha - ryu + 1))
                          / factB(senteGyoku)
                          / factB(goteGyoku)
                          / factB((81 - fu - kyo - kei) - gin - kin - to - narikyo  - narikei - narigin - kaku - uma - hisha - ryu - senteGyoku - goteGyoku)
                          const key = [fu, kyo, kei, gin, kin, to, narikyo, narikei, narigin, kaku, hisha, uma, ryu].join('')
                          total = String(BigInt(total) + patterns)
                          list.push({ key, patterns: String(patterns) })
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    await writeFile(`./allBoardPatterns_${key}.json`, Buffer.from(JSON.stringify(list, null, 2)))
  })
  return total
}

const main = async () => {
  const oneWayColumnPatterns = generateOneWayKomaColumnPatterns()
  await writeFile('./oneWayColumnPatterns.json', Buffer.from(JSON.stringify(oneWayColumnPatterns, null, 2)))
  const oneWayBoardPatterns = generateOneWayKomaBoardPatterns(oneWayColumnPatterns)
  await writeFile('./oneWayBoardPatterns.json', Buffer.from(JSON.stringify(oneWayBoardPatterns, null, 2)))
  const allBoardPatterns = await generateAllKomaBoardPatterns(oneWayBoardPatterns[8])
  console.log(allBoardPatterns)
  // 6056820947506738444045784971572143468392160009444966301221693367028800
}

module.exports = { main }