const decode = require('./decode')

const confidenceInterval = (successes, trials) => {
  const p = successes / trials // 二項分布の推定確率
  const z = 1.96 // 95%の信頼区間

  const standardError = Math.sqrt(p * (1 - p) / trials)

  return {
    min: Math.max(0, p - z * standardError),
    max: Math.min(1, p + z * standardError),
  }
}

const estimate = async (trials = process.env.ESTIMATION_TRIALS || 100) => {
  const results = await [...Array(trials)].reduce((a, i) => a.then(async a => {
    const result = await decode().then(result => [result]).catch(() => [])
    return [...a, ...result]
  }), Promise.resolve([]))
  const successes = results.filter(result => result.data.isValid).length
  const allPatterns = Number(results[0].data.allBoardPatterns.value)
  console.log(allPatterns)
  console.log(successes)
  const { min, max } = confidenceInterval(successes, trials)
  const result = {
    min: min * allPatterns,
    max: max * allPatterns,
  }
  console.log(result)
  return result
}

module.exports = estimate