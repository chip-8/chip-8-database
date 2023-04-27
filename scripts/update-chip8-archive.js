const { sha1Hash, mergeIn, writeProgramsJSON } = require("./helpers.js");
const programs = require("../database/programs.json");

const archiveUrl =
  "https://raw.githubusercontent.com/JohnEarnest/chip8Archive/master/programs.json";
const romUrl = (filename) =>
  `https://github.com/JohnEarnest/chip8Archive/raw/master/roms/${filename}.ch8`;

fetchConvertAndUpdate();

async function fetchConvertAndUpdate() {
  const archive = await fetchArchive();
  const converted = await convert(archive);
  const updated = mergeIn(programs, converted);
  writeProgramsJSON(updated);
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
