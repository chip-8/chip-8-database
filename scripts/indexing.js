const fs = require("fs");
const path = require("path");
const { sha1Hash, mergeIn, writeProgramsJSON } = require("./helpers.js");
const programs = require("../database/programs.json");

const docTypes = ["txt", "md"];
const imageTypes = ["jpg", "jpeg", "png", "gif"];
const romTypes = {
  ch8: "chip8",
  sc8: "schip",
  xo8: "xochip",
  c8x: "chip8x",
  mc8: "megachip8",
  hc8: "hybrid-vip",
  c8h: "hires-chip8",
};

// Find all the files in this directory, and sort by type

const directory = process.argv[2];
if (!directory) {
  console.log(
    "Please pass in the directory to scan as a command line parameter:\n\n  $ npm run index-directory <some directory> [verbose] [overwrite]"
  );
  process.exit();
}
const verbose = process.argv.includes("verbose");
const overwrite = process.argv.includes("overwrite");

const files = recursiveReadDirSync(directory);
const roms = files.filter((file) =>
  Object.keys(romTypes).includes(file.split(".").pop())
);
const documentation = files
  .filter((file) => docTypes.includes(file.split(".").pop()))
  .map((file) => ({ file, base: path.parse(file).name }));
const images = files
  .filter((file) => imageTypes.includes(file.split(".").pop()))
  .map((file) => ({ file, base: path.parse(file).name }));

// Create a list of all the ROMs and hash those files

console.log("Finding and hashing all ROM files...");

const newPrograms = [];
for (const rom of roms) {
  newPrograms.push({
    file: path.basename(rom),
    sha1: sha1Hash(fs.readFileSync(rom)),
    platform: romTypes[rom.split(".").pop()],
  });
}

// Parse as much information from the file name as we can

console.log("\nParsing ROM file names for metadata...");

for (const program of newPrograms) {
  addMetaDataFromFileName(program);
}

// Find documentation and images for all the programs, with an increasing
// tolerance for "fuzzy" matches. Files that have matched previously are
// skipped, which is how this method gets a good result.

console.log(
  "\nMatching ROMs with documentation and images... (this may take a while)"
);

for (let cutOff = 0.8; cutOff > 0.05; cutOff -= 0.01) {
  for (const program of newPrograms) {
    if (documentation.length > 0 && !program.description)
      addDocumentation(program, documentation, cutOff);
    if (images.length > 0) addImages(program, images, cutOff);
  }
}

// Show results

console.log("\nTotal ROM files:", newPrograms.length);

console.log("\nTotal documentation files:", documentation.length);
console.log(
  "Documentation files matched to programs:",
  newPrograms.reduce((total, prog) => (total += prog.description ? 1 : 0), 0)
);
console.log(
  "Documentation files left:",
  documentation.filter((doc) => doc).length
);
if (verbose)
  console.log(documentation.filter((doc) => doc).map((doc) => doc.file));

console.log("\nTotal image files:", images.length);
console.log(
  "Images matched to programs:",
  newPrograms.reduce(
    (total, prog) => (total += prog.images ? prog.images.length : 0),
    0
  )
);
console.log("Image files left:", images.filter((img) => img).length);
if (verbose) console.log(images.filter((img) => img).map((img) => img.file));

// Save results to the `programs.json` file

const updated = mergeIn(programs, newPrograms, overwrite);
writeProgramsJSON(updated);

// Helper functions from here on down

function addMetaDataFromFileName(program) {
  const noBacketsMatcher = /^([^\(\[\.]+)/g;
  const title = program.file.match(noBacketsMatcher)[0].trim();
  if (title) program.title = title;

  const bracketsMatcher = /[\(\[,](.*?)[\)\],]/g;
  const remarkMatchers = [
    "demo",
    "alt",
    "sound",
    "fix",
    "unknown",
    "press",
    "key",
    "hack",
    "with",
    "unfinished",
  ];
  const thingsInBrackets = [...program.file.matchAll(bracketsMatcher)].map(
    (v) => v[1].trim()
  );

  // Find things that look like dates
  const date = thingsInBrackets.find((v) => isDateLike(v));
  if (date) {
    if (date != "xxxx" && date != "????") program.release = date;
    thingsInBrackets.splice(thingsInBrackets.indexOf(date), 1);
  }

  // Find things that look like remarks
  const remarks = thingsInBrackets.filter((v) =>
    remarkMatchers.some((remark) =>
      v.toLowerCase().includes(remark.toLowerCase())
    )
  );
  if (remarks.length > 0) {
    program.remarks = remarks.join(" ");
    for (const remark of remarks) {
      thingsInBrackets.splice(thingsInBrackets.indexOf(remark), 1);
    }
  }

  // Find things that look like authors
  const authors = thingsInBrackets.filter((v) => v.startsWith("by "));
  if (authors.length > 0) {
    program.authors = authors.map((v) => v.substr(2).trim());
    for (const author of authors) {
      thingsInBrackets.splice(thingsInBrackets.indexOf(author), 1);
    }
  }

  // What to do with the remaining things?
  switch (thingsInBrackets.length) {
    case 0:
      return;
    case 1:
      // Presume that what's left is an author name if we don't have one yet
      if (!program.authors) {
        program.authors = thingsInBrackets;
        return;
      }
    default:
      console.log("Not sure what to do with this:", thingsInBrackets);
      return;
  }
}

function addDocumentation(program, documentation, cutOff = 0.15) {
  const bareProgramName = path.parse(program.file).name;

  // See if we can find any documentation that is a literal file match
  let match = documentation
    .filter((doc) => doc)
    .find((doc) => doc.base == bareProgramName);

  if (!match) {
    // Maybe a fuzzy match then..?
    documentation.forEach(
      (doc) => (doc.similarity = similarity(doc.base, bareProgramName))
    );
    documentation.sort((a, b) => b.similarity - a.similarity);
    if (documentation[0].similarity > cutOff) match = documentation[0];
  }

  if (!match) return;

  delete documentation[documentation.indexOf(match)];

  program.description = fs
    .readFileSync(match.file, { encoding: "utf-8" })
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
}

function addImages(program, images, cutOff = 0.15) {
  const bareProgramName = path.parse(program.file).name;

  // See if we can find any documentation that is a literal file match
  let match = images
    .filter((img) => img)
    .find((img) => img.base == bareProgramName);

  if (!match) {
    // Maybe a fuzzy match then..?
    images.forEach(
      (img) => (img.similarity = similarity(img.base, bareProgramName))
    );
    images.sort((a, b) => b.similarity - a.similarity);
    if (images[0].similarity > cutOff) match = images[0];
  }

  if (!match) return;

  delete images[images.indexOf(match)];

  program.images ||= [];
  program.images.push(path.basename(match.file));
}

function similarity(word1, word2) {
  word1 = word1.toLowerCase().replace(/[\(\[\)\]\- ,]/g, "");
  word2 = word2.toLowerCase().replace(/[\(\[\)\]\- ,]/g, "");
  // console.log(word1, word2);
  const largest = Math.max(word1.length, word2.length);
  const smallest = Math.min(word1.length, word2.length);
  let i;
  for (i = 2; i < smallest; i++) {
    if (word1.slice(0, i) != word2.slice(0, i)) {
      return (i - 2) / largest;
    }
  }
  return (i - 2) / largest;
}

function isDateLike(str) {
  const dateMatcher = /^[\dx\?]{4}([\-\/]\d{1,2}){0,2}$/g;
  return dateMatcher.test(str);
}

function recursiveReadDirSync(directory) {
  directory = path.resolve(directory);
  const paths = fs.readdirSync(directory);
  const files = [];
  for (let p of paths) {
    p = path.join(directory, p);
    if (fs.lstatSync(p).isDirectory()) {
      files.push(...recursiveReadDirSync(p));
    } else {
      files.push(p);
    }
  }
  return files;
}
