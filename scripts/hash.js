const fs = require("fs");
const { sha1Hash } = require("./helpers.js");
const filename = process.argv[2];

let file;
try {
  file = fs.readFileSync(filename);
} catch (err) {
  console.error("Could not find or read file", filename, "\n\n", err);
  process.exit();
}

console.log("File:", filename);
console.log("Hash:", sha1Hash(file));
