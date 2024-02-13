const fs = require('fs')
const yaml = require('js-yaml')

function parseYaml (filename) {
  return yaml.load(fs.readFileSync(filename, 'utf8'))
}

function parseAllYaml (directory) {
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
  return files.reduce((acc, file) => {
    const fileData = parseYaml(`${directory}/${file}`)
    return { ...acc, ...fileData }
  }, {})
}

function writeJsData (data, filename = './data.js') {
  const dataString = `module.exports = Object.freeze(JSON.parse(${JSON.stringify(data, null, 2)}));`
  try {
    fs.writeFileSync(filename, dataString)
    console.log(`Data successfully written to ${filename}`)
  } catch (e) {
    console.error(`Failed to write data to ${filename}:`, e)
  }
}

function main () {
  const args = process.argv.slice(2)
  const directory = args[0]
  const outputFilename = args[1] || './data.js'

  if (!directory) {
    console.error('Please provide a data directory containing yaml files as the first argument.')
    process.exit(1)
  }

  const data = parseAllYaml(directory)
  writeJsData(data, outputFilename)
}

main()
