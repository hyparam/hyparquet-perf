import { createWriteStream, promises as fs } from 'fs'
import { asyncBufferFromFile } from './asyncBuffer.js'
import { pipeline } from 'stream/promises'
import packageJson from '../package.json' with { type: 'json' }
import { tests } from './tests.js'

const url = 'https://s3.hyperparam.app/tpch-lineitem-v2.parquet'
const filename = 'data/tpch-lineitem-v2.parquet'
await getTestFile()
const file = await asyncBufferFromFile(filename)
const iterations = 1

const version = packageJson.devDependencies.hyparquet

async function runTests() {
  for (const { name, runTest } of tests) {
    // pre-1.7.0 ignored the filter parameter
    if (name === 'query-with-filter') {
      // if it looks like a version string, parse it "^1.7.0"
      if (/^\^(\d+)\.(\d+)\.(\d+)$/.test(version)) {
        const parts = version.slice(1).split('.')
        const major = Number(parts[0])
        const minor = Number(parts[1])
        if (major < 1) continue
        if (major === 1 && minor <= 7) continue
      }
    }

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
          version,
          ms,
          readBytes: metered.readBytes,
          reads: metered.reads,
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
  return {
    readBytes: 0,
    reads: 0,
    byteLength: file.byteLength,
    slice(start, end = file.byteLength) {
      this.readBytes += end - start
      this.reads++
      return file.slice(start, end)
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
