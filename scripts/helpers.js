const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const prettier = require("prettier");
const csscolors = require("css-color-names");

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

const colorMatcher = /^#[0-9a-f]{6}$/;

function cast(input, type) {
  switch (type) {
    case "string":
      return input.toString();
    case "boolean":
      return !!input;
    case "integer":
      return +input;
    case "color":
      // The colours in the CHIP-8 Archive are a bit of a mess. Attempt to clean
      // up all the fancy css colour names, colours without a '#' prefix and
      // colours like '#000'.
      input = input.toString().toLowerCase();
      if (input.match(colorMatcher)) return input;
      if (input in csscolors) return csscolors[input].toLowerCase();
      const prefixed = "#" + input;
      if (prefixed.match(colorMatcher)) return prefixed;
      const doubled =
        "#" +
        input
          .replace("#", "")
          .split("")
          .map((hex) => [hex, hex])
          .flat()
          .join("");
      if (doubled.match(colorMatcher)) return doubled;
      // Still not a valid colour, return for the JSON schema to complain about
      return input;
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
  "urls",
  "options",
  // "remarks"
];

const allowedProgramOptions = {
  tickrate: "integer",
  fillColor: "color",
  fillColor2: "color",
  blendColor: "color",
  backgroundColor: "color",
  buzzColor: "color",
  quietColor: "color",
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
