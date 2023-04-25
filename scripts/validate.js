// This validation script checks to see if all JSON files in `./database`
// actually exist, have associated JSON schema files, parse as JSON and conform
// to their respective JSON schemas.

const fs = require("fs");
const { Validator } = require("jsonschema");
require("colors");

// Which files to test?

const checks = [check("programs")];

// Script start

const errors = checks.reduce((count, test) => (count += test ? 0 : 1), 0);
const success = errors == 0;
const resultString = success
  ? "\nAll checks passed"
  : `\nChecks failed for ${errors} file${errors == 1 ? "" : "s"}`;
console.log(resultString[success ? "brightGreen" : "brightRed"].bold);
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

  const validator = new Validator();
  const result = validator.validate(subject, schema);
  if (!result.valid) {
    console.error(indent(`𝘅 File does not adhere to the schema:`, 1).red);
    console.error(indent(result.toString(), 2));
    return false;
  }

  console.log(indent("✔ All good!", 1).green);
  return true;
}

function indent(str, level) {
  return str.replace(/^/gm, "  ".repeat(level));
}
