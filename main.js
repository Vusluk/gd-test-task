const genRandomNum = (min, max) => {
  const randomBuffer = new Uint32Array(1);
  global.crypto.getRandomValues(randomBuffer);
  let randomNumber = randomBuffer[0] / (0xffffffff + 1);
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(randomNumber * (max - min + 1)) + min;
}

const genMatrix = (size = 10, min, max) => {
  const genRow = () => new Array(size).fill(null).map(() => genRandomNum(min, max))
  return new Array(size).fill(null).map(() => genRow())
}

const colorizeCell = (content, sign) => sign === true ? `\x1b[32m${content}\x1b[0m` : sign === false ? `\x1b[31m${content}\x1b[0m` : content

const renderCell = (content, cellLength) => (new Array(cellLength).fill(' ').join('') + content).slice(-cellLength)

const renderMatrix = (matrix, min, max) => {
  const maxCellContentLength = Math.max(String(min).length, String(max).length)
  const rows = []

  let rowSameSignsCount = 1
  let rowReplacements = 0
  let rowMinimumPositive = null
  let commonMinimumRowIndex = 0
  let commonMinimum = null

  matrix.join(',').split(',').forEach((cell, index, arr) => {
    const currentRowIndex = Math.trunc(index / matrix.length)
    const isFirstRowCell = index === 0 || (Math.trunc((index - 1) / matrix.length) < currentRowIndex)
    const isLastRowCell = index === arr.length - 1 || (Math.trunc((index + 1) / matrix.length) > currentRowIndex)

    const numberPrev = isFirstRowCell ? null : Number(arr[index - 1])
    const number = Number(cell)

    // ROW MINIMUM POSITIVE
    if (isFirstRowCell) rowMinimumPositive = null
    const needToInitializeRowMinimumPositive = number > 0 && !rowMinimumPositive
    const needToUpdateRowMinimumPositive = number > 0 && number < rowMinimumPositive
    if (needToInitializeRowMinimumPositive || needToUpdateRowMinimumPositive) rowMinimumPositive = number

    // COMMON MINIMUM
    if (!commonMinimum || number < commonMinimum) {
      commonMinimum = number
      commonMinimumRowIndex = currentRowIndex
    }

    // REPLACEMENTS
    const currentSign = number > 0 ? true : number < 0 ? false : null
    const prevSign = numberPrev > 0 ? true : numberPrev < 0 ? false : null
    const signsChanged = currentSign === null || prevSign === null || currentSign !== prevSign
    if (isFirstRowCell) {
      rowReplacements = 0
      rowSameSignsCount = 1
    } else if (signsChanged) {
      rowReplacements += Math.trunc(rowSameSignsCount / 3)
      rowSameSignsCount = 1
    } else if (!signsChanged && isLastRowCell) {
      rowSameSignsCount += 1
      rowReplacements += Math.trunc(rowSameSignsCount / 3)
    } else {
      rowSameSignsCount += 1
    }

    // RENDER
    if (!rows[currentRowIndex]) rows[currentRowIndex] = ''
    rows[currentRowIndex] += `${isFirstRowCell ? '║' : '|'} ${colorizeCell(renderCell(cell, maxCellContentLength), currentSign)} `

    if (isLastRowCell) {
      const rowMinimumPositiveCell = renderCell(rowMinimumPositive, maxCellContentLength - 1)
      const rowReplacementsCell = renderCell(rowReplacements, maxCellContentLength - 3)
      rows[currentRowIndex] += `║ ${rowMinimumPositiveCell} | ${rowReplacementsCell} ║`
    }
  })

  rows[commonMinimumRowIndex] = rows[commonMinimumRowIndex].replace(`${commonMinimum}`, `\x1b[36m${commonMinimum}\x1b[0m`)
  rows[commonMinimumRowIndex] += '\x1b[36m *\x1b[0m'

  return rows.join('\n')
}

const VALID_ARGS_FIELDS = ['min', 'max', 'size']
const MAX_VALID_MAX = 1000
const MIN_VALID_MIN = -1000
const MAX_VALID_SIZE = 20

const parseArgs = () => {
  const [nodeExec, pathToFile, ...args] = process.argv
  if (args.length > 10) throw Error(`Too many arguments`);
  const params = {
    min: -100,
    max: 100,
    size: 10,
  }
  args.forEach(arg => {
    [field, valueString] = arg.split('=');
    const value = Number(valueString)
    const isValidField = VALID_ARGS_FIELDS.includes(field)
    const isValidValue = !isNaN(Number(valueString))
    if (!isValidField) console.warn(`WARNING: argument field must be one of "${VALID_ARGS_FIELDS.join('; ')}", get: "${field}". Fallback to default`)
    if (!isValidValue) console.warn(`WARNING: argument value must be a number, get: "${valueString}". Fallback to default.`)
    if (isValidField && isValidValue) params[field] = value
  })
  return params;
}

const main = () => {
  const { size, min, max } = parseArgs()
  const matrix = genMatrix(size, min, max)
  console.log(renderMatrix(matrix, min, max))
}

main()