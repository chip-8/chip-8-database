const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const programsFile = path.resolve("./database/programs.json");
const hashesFile = path.resolve("./database/sha1-hashes.json");
const programs = require(programsFile);

const hashes = {};
for (const id in programs) {
  for (const hash of Object.keys(programs[id].roms)) {
    hashes[hash] = id;
  }
}

fs.writeFileSync(
  hashesFile,
  prettier.format(JSON.stringify(hashes, null, "  "), { parser: "json" })
);
