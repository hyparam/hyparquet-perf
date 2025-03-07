
// Fetch the perf.jsonl file in the same directory
fetch('./perf.jsonl')
  .then((response) => response.text())
  .then((text) => {
    // Split file contents by newline and parse each line as JSON
    const lines = text.trim().split('\n')
    const rawData = lines.map(JSON.parse)
    
    // Extract unique versions (sorted)
    const versions = [...new Set(rawData.map(d => d.version))].sort()

    // Extract unique test names
    const testNames = [...new Set(rawData.map(d => d.name))]

    // Create a lookup: { name: { version: ms } }
    const lookup = {}
    rawData.forEach(item => {
      const { name, version, ms } = item
      if (!lookup[name]) {
        lookup[name] = {}
      }
      lookup[name][version] = ms
    })

    // Build datasets for Chart.js
    const datasets = testNames.map(name => {
      return {
        label: name,
        data: versions.map(version => lookup[name][version] ?? null),
        borderColor: getRandomColor(),
        fill: false
      }
    })

    // A helper function to generate random color for lines
    function getRandomColor() {
      return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
    }

    // Render the chart
    const ctx = document.getElementById('benchmarkChart').getContext('2d')
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: versions,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'logarithmic',
            title: {
              display: true,
              text: 'Time (ms)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Version'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Benchmark Results'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    })
  })
  .catch((error) => {
    console.error('Error loading or parsing perf.jsonl:', error)
  })
