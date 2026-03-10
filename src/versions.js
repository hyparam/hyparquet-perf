import { promises as fs } from 'fs'
import { appDir, streamCommand , median} from './utils.js'

async function run() {
  // Fetch the hightable versions from npm
  const versionsData = await fetch('https://registry.npmjs.org/hightable')
    .then(res => res.json())

  // Extract the version numbers and reverse() for the newest first
  const versions = Object.keys(versionsData.versions).reverse()
    .filter(v => v.startsWith('0.26.')) // Only test versions starting with 0.26. for now.

  // Remove perf.jsonl
  await fs.unlink('perf.jsonl').catch(() => {})

  for (const version of versions) {
    console.log(`\nRunning tests for hightable@${version}`)

    // Install the specified version (streams stdout/stderr)
    await streamCommand('npm', ['install', '-E', `hightable@${version}`], { cwd: appDir })

    // Build the app (streams stdout/stderr)
    await streamCommand('npm', ['run', 'build'], { cwd: appDir })

    // Run your test script (streams stdout/stderr)
    try {
      await streamCommand('npm', ['run', 'playwright'], { printOutput: true })
      // transform test-results.json and append to perf.jsonl
      const testResults = JSON.parse(await fs.readFile('test-results.json', 'utf-8'))
      for (const suite of testResults.suites) {
        for (const spec of suite.specs) {
          const name = spec.title
          const tests = spec.tests
          if (tests.length !== 1) {
            throw new Error(`Expected exactly 1 test in spec "${name}", but found ${tests.length}`)
          }
          const test = tests[0]
          const results = test.results
          if (results.length !== 1) {
            throw new Error(`Expected exactly 1 result in test "${name}", but found ${results.length}`)
          }
          const result = results[0]
          if (result.status !== 'passed') {
            throw new Error(`Test "${name}" did not pass, status: ${result.status}`)
          }
          const steps = result.steps
          if (steps.length === 0) {
            throw new Error(`No steps found in result for test "${name}"`)
          }
          const ms = median(steps.map(step => Number(step.duration)))
          const str = JSON.stringify({
            name,
            version,
            ms,
            date: new Date().toISOString(),
          })
          console.log(str)
          // Also append to perf.jsonl
          await fs.appendFile('perf.jsonl', str + '\n')
        }
      }
    } catch (err) {
      console.error(`Error running test for hightable@${version}:`, err)
    }
  }
}

run().catch(err => {
  console.error('Fatal error during installation/testing:', err)
  process.exit(1)
})
