import { createWriteStream, promises as fs } from 'fs'
import { asyncBufferFromFile } from './asyncBuffer.js'
import { pipeline } from 'stream/promises'
import packageJson from './package.json' with { type: 'json' }
import { tests } from './tests.js'

const url = 'https://s3.hyperparam.app/tpch-lineitem-v2.parquet'
const filename = 'data/tpch-lineitem-v2.parquet'
await getTestFile()
const file = await asyncBufferFromFile(filename)
const iterations = 1

async function runTests() {
  for (const { name, runTest } of tests) {
    for (let i = 0; i < iterations; i++) {
      const metered = meteredAsyncBuffer(file)
      const start = performance.now()

      // Run tests
      try {
        await runTest(metered)

        const ms = performance.now() - start
        let stat = await fs.stat(filename).catch(() => undefined)
  
        const str = JSON.stringify({
          name,
          version: packageJson.devDependencies.hyparquet,
          ms,
          readBytes: metered.readBytes,
          fileSize: stat.size,
          date: new Date().toISOString(),
        })
        console.log(str)
        // Also append to perf.jsonl
        await fs.appendFile('perf.jsonl', str + '\n')
      } catch (err) {
        console.error(`Error running test ${name}: ${err}`)
      }
    }
  }
}

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
