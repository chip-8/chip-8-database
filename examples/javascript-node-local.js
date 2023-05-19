/**
 * Example script for querying a local `programs.json` file in NodeJS.
 * Run with:
 *   $ node ./examples/javascript-node-local.js <path to ROM file>
 */

// Requirements for Node
const fs = require("fs");
const crypto = require("crypto");

// Import the database JSON files
const hashes = require("../database/sha1-hashes.json");
const programs = require("../database/programs.json");

// Returns a SHA1 hash of the given binary data
function sha1Hash(data) {
  const shasum = crypto.createHash("sha1");
  shasum.update(data);
  return shasum.digest("hex");
}

// Check if parameter exists
if (process.argv.length != 3) {
  console.error(
    "Run with:\n$ node ./examples/javascript-node-local.js <path to ROM file>"
  );
  process.exit();
}

// Load the ROM file and calculate the SHA1 hash
const file = fs.readFileSync(process.argv[2]);
const hash = sha1Hash(file);
console.log(hash);

// Find the program and ROM metadata in the CHIP-8 database
if (!(hash in hashes)) {
  console.error("That file is not in the CHIP-8 database!");
  process.exit();
}
const programMetadata = programs[hashes[hash]];
const romMetadata = programMetadata.roms[hash];

console.log("Program metadata:", programMetadata);
console.log("ROM metadata:", romMetadata);

// Check to see if we can run this program in our interpreter by finding the
// intersection between what we support and what the ROM supports. The order of
// the ROM's platforms array defines its preference, so take the first match.
const platformsWeSupport = ["modernChip8", "superchip"];
const platformsTheRomSupports = romMetadata.platforms;
const chosenPlatform = platformsTheRomSupports.find((p) =>
  platformsWeSupport.includes(p)
);

console.log("Running the interpreter with platform:", chosenPlatform);

if (!chosenPlatform) {
  console.error("We don't support the requested platform(s) for this ROM");
  process.exit();
}

// startInterpreter(file, chosenPlatform);
