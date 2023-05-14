const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const prettier = require("prettier");

const programs = require("../database/programs.json");
const hashes = require("../database/sha1-hashes.json");

module.exports = {
  sha1Hash,
  mergeWithPrograms,
  writeProgramsJSON,
  getEmbeddedTitle,
  findProgram,
};

// Returns a SHA1 hash of the given binary data
function sha1Hash(data) {
  const shasum = crypto.createHash("sha1");
  shasum.update(data);
  return shasum.digest("hex");
}

function getEmbeddedTitle(data) {
  // Does the binary start with a jump?
  if ((data[0] & 0xf0) != 0x10) return false;

  // Find the potential name!
  const end = ((data[0] & 0x0f) << 8) + data[1];
  const bytes = data.slice(2, end - 0x200);

  // Does the jump go over data in the ASCII range?
  if (!bytes.every((byte) => byte >= 32 && byte < 127)) return false;

  // Then we've probably found a name
  const string = String.fromCharCode(...bytes).trim();

  // Empty names are not relevant
  if (string.length == 0) return false;

  return string;
}

// Merges array newPrograms into array programs, modifies and returns programs
function mergeWithPrograms(newPrograms, override = false) {
  for (const program of newPrograms) {
    const duplicate = findProgram(Object.keys(program.roms)[0]);
    if (duplicate) {
      if (!override) merge(program, duplicate);
      merge(duplicate, program);
    } else {
      programs.push(program);
    }
  }
  return programs;
}

function merge(target, source) {
  for (const property in source) {
    if (
      typeof source[property] === "object" &&
      !Array.isArray(source[property])
    ) {
      if (property in target && typeof target[property] === "object")
        merge(target[property], source[property]);
      else target[property] = source[property];
    } else {
      target[property] = source[property];
    }
  }
}

// Overwrite programs.json with the given parameter
function writeProgramsJSON(programs) {
  fs.writeFileSync(
    path.resolve("./database/programs.json"),
    prettier.format(JSON.stringify(programs, null, "  "), { parser: "json" })
  );
}

function findProgram(hash) {
  return programs[hashes[hash]];
}
