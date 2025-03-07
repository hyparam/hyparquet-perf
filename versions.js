import { spawn } from 'child_process'
import { promises as fs } from 'fs'

function streamCommand(command, args = [], printOutput = true) {
  return new Promise((resolve, reject) => {
    // Set { shell: true } so we can pass in command strings (like npm install ...) easily
    const child = spawn(command, args, { shell: true })

    // Stream the stdout directly to this process's stdout
    if (printOutput) {
      child.stdout.on('data', (data) => {
        process.stdout.write(data)
      })
    }

    // Stream the stderr directly to this process's stderr
    child.stderr.on('data', (data) => {
      process.stderr.write(data)
    })

    // If there's an error spawning the process, reject immediately
    child.on('error', (error) => {
      reject(error)
    })

    // When the command completes, check the exit code
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" failed with exit code ${code}`))
      }
    })
  })
}

async function run() {
  // Fetch the hyparquet versions from npm
  const versionsData = await fetch('https://registry.npmjs.org/hyparquet')
    .then(res => res.json())

  // Extract the version numbers and reverse() for the newest first
  const versions = Object.keys(versionsData.versions).reverse()
    .filter(v => v !== '0.7.3') // 0.7.3 sucked

  // Remove perf.jsonl
  await fs.unlink('perf.jsonl').catch(() => {})

  for (const version of versions) {
    console.log(`\nRunning tests for hyparquet@${version}`)

    // Install the specified version (streams stdout/stderr)
    await streamCommand('npm', ['install', `hyparquet@${version}`], false)

    // Run your test script (streams stdout/stderr)
    try {
      await streamCommand('node', ['index.js'])
    } catch (err) {
      console.error(`Error running test for hyparquet@${version}:`, err)
    }
  }
}

run().catch(err => {
  console.error('Fatal error during installation/testing:', err)
  process.exit(1)
})
