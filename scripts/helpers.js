const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const prettier = require("prettier");

module.exports = {
  sha1Hash,
  mergeIn,
  writeProgramsJSON,
};

// Returns a SHA1 hash of the given binary data
function sha1Hash(data) {
  const shasum = crypto.createHash("sha1");
  shasum.update(data);
  return shasum.digest("hex");
}

// Merges array newPrograms into array programs, modifies and returns programs
function mergeIn(programs, newPrograms, override = true) {
  for (let program of newPrograms) {
    program = cleanUp(program);
    const duplicate = programs.find((p) => p.sha1 == program.sha1);
    if (duplicate) {
      if (!override) Object.assign(program, duplicate);
      Object.assign(duplicate, program);
    } else {
      programs.push(program);
    }
  }
  return programs;
}

// Overwrite programs.json with the given parameter
function writeProgramsJSON(programs) {
  fs.writeFileSync(
    path.resolve("./database/programs.json"),
    prettier.format(JSON.stringify(programs, null, "  "), { parser: "json" })
  );
}

function cleanUp(program) {
  for (const property in program) {
    if (allowedProgramProperties.includes(property)) continue;
    if (property == "desc") program.description = program.desc;
    delete program[property];
  }
  for (const property in program.options) {
    if (Object.keys(allowedProgramOptions).includes(property)) {
      program.options[property] = cast(
        program.options[property],
        allowedProgramOptions[property]
      );
      continue;
    }
    delete program.options[property];
  }
  return program;
}

function cast(input, type) {
  switch (type) {
    case "string":
      return input.toString();
    case "boolean":
      return !!input;
    case "integer":
      return +input;
  }
}

const allowedProgramProperties = [
  "title",
  "file",
  "sha1",
  "event",
  "description",
  "release",
  "platform",
  "authors",
  "images",
  "options",
  // "remarks"
];

const allowedProgramOptions = {
  tickrate: "integer",
  fillColor: "string",
  fillColor2: "string",
  blendColor: "string",
  backgroundColor: "string",
  buzzColor: "string",
  quietColor: "string",
  shiftQuirks: "boolean",
  loadStoreQuirks: "boolean",
  vfOrderQuirks: "boolean",
  clipQuirks: "boolean",
  jumpQuirks: "boolean",
  vBlankQuirks: "boolean",
  logicQuirks: "boolean",
  enableXO: "boolean",
  screenRotation: "integer",
  touchInputMode: "string",
  fontStyle: "string",
};
