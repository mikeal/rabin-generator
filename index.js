'use strict'
const { create } = require('rabin-wasm')
const bytes = require('bytesish')

/* these may not be the best default values, should do some testing */
const avg = 128
const _bits = Math.floor(Math.log2(avg))
const _min = Math.floor(avg / 3)
const _max = Math.floor(avg + (avg / 2))

const chunker = async function * (data, bits = _bits, min = _min, max = _max) {
  if (typeof data[Symbol.asyncIterator] !== 'function') {
    const chunk = data
    data = (function * () { yield chunk })()
  }
  const rabin = await create(bits, min, max)

  let tail
  for await (let _chunk of data) {
    const indexes = rabin.fingerprint(bytes.typedArray(_chunk))
    if (tail) _chunk = bytes.concat([tail, _chunk])
    let i = 0
    while (indexes.length) {
      const size = indexes.shift()
      yield bytes.slice(_chunk, i, size + i)
      i += size
    }
    if (i < _chunk.byteLength) tail = bytes.slice(_chunk, i)
    else tail = null
  }
  if (tail) yield tail
}

module.exports = chunker
