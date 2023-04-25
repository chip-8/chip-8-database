const fs = require("fs");
const crypto = require("crypto");
const prettier = require("prettier");

const programsFile = "./database/programs.json";
const programs = require(programsFile);

const archiveUrl =
  "https://raw.githubusercontent.com/JohnEarnest/chip8Archive/master/programs.json";
const romUrl = (filename) =>
  `https://github.com/JohnEarnest/chip8Archive/raw/master/roms/${filename}.ch8`;

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

fetchConvertAndUpdate();

async function fetchConvertAndUpdate() {
  const archive = await fetchArchive();
  const converted = await convert(archive);
  const updated = update(programs, converted);
  fs.writeFileSync(
    programsFile,
    prettier.format(JSON.stringify(updated, null, "  "), { parser: "json" })
  );
}

async function fetchArchive() {
  const response = await fetch(archiveUrl);
  return await response.json();
}

async function convert(object) {
  const result = [];
  for (const file in object) {
    const hash = await fetchAndHash(file);
    const obj = object[file];
    obj.sha1 = hash;
    obj.file = `${file}.ch8`;
    result.push(obj);
  }
  return result;
}

async function fetchAndHash(file) {
  const response = await fetch(romUrl(file));
  const data = await response.arrayBuffer();
  const typedArray = new Uint8Array(data);
  return sha1Hash(typedArray);
}

function sha1Hash(blob) {
  const shasum = crypto.createHash("sha1");
  shasum.update(blob);
  return shasum.digest("hex");
}

function update(programs, archive) {
  for (let program of archive) {
    program = cleanUp(program);
    const duplicate = programs.find((p) => p.sha1 == program.sha1);
    if (duplicate) {
      Object.assign(duplicate, program);
    } else {
      programs.push(program);
    }
  }
  return programs;
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
