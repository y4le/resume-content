const fs = require('fs')
const yaml = require('js-yaml')
const Ajv = require('ajv')

let ajv = null

function parseYaml (filename) {
  const data = yaml.load(fs.readFileSync(filename, 'utf8'))
  return validatePropertiesWithSchema(data)
}

function validatePropertiesWithSchema (data) {
  if (ajv === null) {
    ajv = new Ajv()
  }

  Object.keys(data).forEach(key => {
    const schemaKey = `${key}_schema`
    if (data[schemaKey]) {
      const validate = ajv.compile(data[schemaKey])
      const isValid = validate(data[key])
      if (!isValid) {
        throw new Error(`Schema validation for ${key} failed: ${JSON.stringify(validate.errors, null, 2)}`)
      }
    }
  })

  return data
}

function parseAllYaml (directory) {
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
  let mergedData = {}
  const schemas = {}

  files.forEach(file => {
    const fileData = parseYaml(`${directory}/${file}`)
    Object.keys(fileData).forEach(key => {
      if (key.endsWith('_schema')) {
        schemas[key.replace('_schema', '')] = fileData[key]
      } else {
        if (!mergedData[key]) {
          mergedData[key] = []
        }
        mergedData[key] = mergedData[key].concat(fileData[key])
      }
    })
  })

  mergedData = { ...mergedData, schemas }
  return mergedData
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

function writeJsonData (data, filename = './data.json') {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2))
    console.log(`JSON data successfully written to ${filename}`)
  } catch (e) {
    console.error(`Failed to write JSON data to ${filename}:`, e)
  }
}

function main () {
  const args = process.argv.slice(2)
  const directory = args[0]
  const outputFilename = args[1] || './data'

  if (!directory) {
    console.error('Please provide a data directory containing yaml files as the first argument.')
    process.exit(1)
  }

  const data = parseAllYaml(directory)

  if (outputFilename.endsWith('.json')) {
    writeJsonData(data, outputFilename)
  } else if (outputFilename.endsWith('.js')) {
    writeJsData(data, outputFilename)
  } else {
    writeJsData(data, `${outputFilename}.js`)
    writeJsonData(data, `${outputFilename}.json`)
  }
}

main()
