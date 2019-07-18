'use strict'
const assert = require('assert')
const tsame = require('tsame')
const { it } = require('mocha')
const chunker = require('../')
const bytes = require('bytesish')

const test = it

const same = (x, y) => assert.ok(tsame(x, y))

const filled = bytes.random(1e+6)

const createStream = async function * (size) {
  await 'make the linter happy'
  let i = 0
  while (i < filled.byteLength) {
    yield bytes.slice(filled, i, i + size)
    i += size
  }
}

test('single chunk vs multi-chunk', async () => {
  let indexes = []
  let views = []
  for await (const view of chunker(filled)) {
    indexes.push(view.byteLength)
    views.push(view)
  }

  assert(indexes.reduce((x, y) => x + y, 0), filled.byteLength)

  const validate = { indexes, views }

  indexes = Array.from(validate.indexes)
  views = Array.from(validate.views)

  for await (const view of chunker(createStream(1e+6 / 31250))) {
    same(indexes.shift(), view.byteLength)
    assert(bytes.compare(view, views.shift()))
  }

  indexes = Array.from(validate.indexes)
  views = Array.from(validate.views)

  for await (const view of chunker(createStream(1e+6 / 32))) {
    same(indexes.shift(), view.byteLength)
    assert(bytes.compare(view, views.shift()))
  }
})
