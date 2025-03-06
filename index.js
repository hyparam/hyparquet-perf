import { createWriteStream, promises as fs } from 'fs'
import { asyncBufferFromFile, parquetQuery, parquetRead } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { pipeline } from 'stream/promises'
import packageJson from './package.json' with { type: 'json' }

const url = 'https://s3.hyperparam.app/tpch-lineitem.parquet'
const filename = 'data/tpch-lineitem.parquet'
await getTestFile()
const file = await asyncBufferFromFile(filename)
const iterations = 1

async function runTests() {
  for (const { name, runTest } of tests) {
    for (let i = 0; i < iterations; i++) {
      const metered = meteredAsyncBuffer(file)
      const start = performance.now()

      // Run tests
      await runTest(metered)

      const ms = performance.now() - start
      let stat = await fs.stat(filename).catch(() => undefined)

      const str = JSON.stringify({
        name,
        date: new Date().toISOString(),
        version: packageJson.devDependencies.hyparquet,
        fileSize: stat.size,
        readBytes: metered.readBytes,
        ms,
      })
      console.log(str)
      // Also append to perf.jsonl
      await fs.appendFile('perf.jsonl', str + '\n')
    }
  }
}

const tests = [
  {
    name: 'read-all-data',
    async runTest(file) {
      await parquetRead({ file, compressors })
    },
  },
  {
    name: 'read-int-column',
    async runTest(file) {
      await parquetRead({ file, compressors, columns: ['l_quantity'] })
    },
  },
  {
    name: 'read-float-column',
    async runTest(file) {
      await parquetRead({ file, compressors, columns: ['l_discount'] })
    },
  },
  {
    name: 'read-date-column',
    async runTest(file) {
      await parquetRead({ file, compressors, columns: ['l_shipdate'] })
    },
  },
  {
    name: 'read-string-column',
    async runTest(file) {
      await parquetRead({ file, compressors, columns: ['l_comment'] })
    },
  },
  {
    name: 'read-with-row-limits',
    async runTest(file) {
      await parquetRead({ file, compressors, rowStart: 2_000_000, rowEnd: 3_000_000 })
    },
  },
  {
    name: 'query-with-sort',
    async runTest(file) {
      await parquetRead({ file, compressors, sort: 'l_orderkey', rowEnd: 100 })
    },
  },
  {
    name: 'query-with-filter',
    async runTest(file) {
      await parquetQuery({ file, compressors, filter: 'l_quantity > 20' })
    },
  },
]

function meteredAsyncBuffer(file) {
  let readBytes = 0
  return {
    byteLength: file.byteLength,
    slice: (start, end = file.byteLength) => {
      readBytes += end - start
      return file.slice(start, end)
    },
    get readBytes() {
      return readBytes
    },
  }
}

async function getTestFile() {
  // download test parquet file if needed
  let stat = await fs.stat(filename).catch(() => undefined)
  if (!stat) {
    // Ensure data directory exists
    await fs.mkdir('data', { recursive: true })
    console.log('downloading ' + url)
    const res = await fetch(url)
    if (!res.ok) throw new Error(res.statusText)
    // write to file async
    await pipeline(res.body, createWriteStream(filename))
    stat = await fs.stat(filename).catch(() => undefined)
    console.log('downloaded example.parquet', stat.size)
  }
}

runTests()
