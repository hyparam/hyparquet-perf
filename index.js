import { createWriteStream, promises as fs } from 'fs'
import { asyncBufferFromFile, parquetRead } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { pipeline } from 'stream/promises'

async function runTest() {
  getTestFile()
  const file = await asyncBufferFromFile(filename)
  const iterations = 10
  const start = performance.now()

  // read parquet file
  await parquetRead({
    file,
    compressors,
  })

  const ms = performance.now() - start
  let stat = await fs.stat(filename).catch(() => undefined)
  console.log(`parsed ${stat.size.toLocaleString()} bytes in ${ms.toFixed(0)} ms`)
}

const url = 'https://s3.hyperparam.app/tpch-lineitem.parquet'
const filename = 'data/tpch-lineitem.parquet'

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

runTest()
