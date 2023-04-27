// This validation script checks to see if all JSON files in `./database`
// actually exist, have associated JSON schema files, parse as JSON and conform
// to their respective JSON schemas.

const fs = require("fs");
const { Validator } = require("jsonschema");
const jsonSchemaSchema = require("../schemas/schema-schema.json");
require("colors");

// Which files to test?

const checks = [check("programs"), check("sha1-hashes")];

// Do JSON Schema checks

const errors = checks.reduce((count, test) => (count += test ? 0 : 1), 0);
let success = errors == 0;
const resultString = success
  ? "\nJSON Schema checks passed"
  : `\nJSON Schema checks failed for ${errors} file${errors == 1 ? "" : "s"}`;
console.log(resultString[success ? "brightGreen" : "brightRed"].bold);

// Check consistency between JSON files

console.log("\nChecking internal consistency of JSON files...");
const hashes = require('../database/sha1-hashes.json');
const programs = require('../database/programs.json');
const programHashes = programs.map(prog => prog.sha1);
const hashesHashes = Object.keys(hashes);
const notInPrograms = hashesHashes.filter(hash => !programHashes.includes(hash));
const notInHashes = programHashes.filter(hash => !hashesHashes.includes(hash));
if (notInPrograms.length > 0) {
  success = false;
  console.log(indent(`𝘅 ${notInPrograms.length} hashes are in sha1-hashes.json but not in programs.json`, 1).red);
} else {
  console.log(indent(`✔ All hashes in sha1-hashes.json are also in programs.json`, 1).green);
}
if (notInHashes.length > 0) {
  success = false;
  console.log(indent(`𝘅 ${notInHashes.length} hashes are in programs.json but not in sha1-hashes.json`, 1).red);
} else {
  console.log(indent(`✔ All hashes in programs.json are also in sha1-hashes.json`, 1).green);
}

// Show friendly counters

console.log(`\nCHIP-8 database contains ${hashesHashes.length} SHA1 hashes for ${programs.length} programs`);
process.exit(success ? 0 : 1);

// Helper functions

function check(file) {
  console.log(`Checking ${file} file...`);

  const databaseFile = `./database/${file}.json`;
  const schemaFile = `./schemas/${file}.json`;
  let subject, schema;

  try {
    subject = JSON.parse(fs.readFileSync(databaseFile));
  } catch (e) {
    console.error(
      indent(`𝘅 Could not parse ${databaseFile} as valid JSON:`, 1).red
    );
    console.error(indent(e.toString(), 2));
  }

  try {
    schema = JSON.parse(fs.readFileSync(schemaFile));
  } catch (e) {
    console.error(
      indent(`𝘅 Could not parse ${schemaFile} as valid JSON:`, 1).red
    );
    console.error(indent(e.toString(), 2));
  }

  if (subject === undefined || schema === undefined) return false;

  const schemaValidator = new Validator();
  const schemaResult = schemaValidator.validate(schema, jsonSchemaSchema);
  if (!schemaResult.valid) {
    console.error(indent(`𝘅 Schema is not valid JSON schema:`, 1).red);
    console.error(indent(schemaResult.toString(), 2));
    return false;
  }

  const dataValidator = new Validator();
  const dataResult = dataValidator.validate(subject, schema);
  if (!dataResult.valid) {
    console.error(indent(`𝘅 File does not adhere to the schema:`, 1).red);
    console.error(indent(dataResult.toString(), 2));
    return false;
  }

  console.log(indent("✔ All good!", 1).green);
  return true;
}

function indent(str, level) {
  return str.replace(/^/gm, "  ".repeat(level));
}
