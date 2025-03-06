import { createWriteStream, promises as fs } from 'fs'
import { parquetRead } from 'hyparquet'
import { pipeline } from 'stream/promises'

function runPerfTest() {
  getTestFile()
  const iterations = 10
  const start = performance.now()
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

runPerfTest()
