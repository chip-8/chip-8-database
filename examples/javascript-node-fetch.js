/**
 * Example script for querying the `programs.json` file on Github in NodeJS.
 * Run with:
 *   $ node ./examples/javascript-node-fetch.js <path to ROM file>
 */

// Requirements for Node
const fs = require("fs");
const crypto = require("crypto");

// Returns a SHA1 hash of the given binary data
function sha1Hash(data) {
  const shasum = crypto.createHash("sha1");
  shasum.update(data);
  return shasum.digest("hex");
}

// Check if parameter exists
if (process.argv.length != 3) {
  console.error(
    "Run with:\n$ node ./examples/javascript-node-fetch.js <path to ROM file>"
  );
  process.exit();
}

loadROM(process.argv[2]);

async function loadROM(path) {
  // Import the database JSON files
  const hashesRequest = await fetch(
    "https://github.com/chip-8/chip-8-database/raw/master/database/sha1-hashes.json"
  );
  const hashes = await hashesRequest.json();
  const programsRequest = await fetch(
    "https://github.com/chip-8/chip-8-database/raw/master/database/programs.json"
  );
  const programs = await programsRequest.json();

  // Load the ROM file and calculate the SHA1 hash
  const file = fs.readFileSync(path);
  const hash = sha1Hash(file);

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
}
