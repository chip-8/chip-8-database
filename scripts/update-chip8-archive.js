const {
  sha1Hash,
  mergeWithPrograms,
  writeProgramsJSON,
  getEmbeddedTitle,
} = require("./helpers.js");
const csscolors = require("css-color-names");
const platforms = require("../database/platforms.json");

const archiveUrl =
  "https://raw.githubusercontent.com/JohnEarnest/chip8Archive/master/programs.json";
const romUrl = (filename) =>
  `https://github.com/JohnEarnest/chip8Archive/raw/master/roms/${filename}.ch8`;

fetchConvertAndUpdate(process.argv.includes("overwrite"));

async function fetchConvertAndUpdate(overwrite) {
  const response = await fetch(archiveUrl);
  const archive = await response.json();
  const converted = await convert(archive);
  const updated = mergeWithPrograms(converted, overwrite);
  writeProgramsJSON(updated);
}

async function convert(object) {
  const result = [];
  for (const fileName in object) {
    const program = {
      ...cleanedProgram(object[fileName]),
      roms: {},
    };
    const rom = await fetchROM(fileName);
    const hash = sha1Hash(rom);
    program.roms[hash] = {
      file: `${fileName}.ch8`,
      ...cleanedROM(object[fileName]),
    };
    const embeddedTitle = getEmbeddedTitle(rom);
    if (embeddedTitle) program.roms[hash].embeddedTitle = embeddedTitle;
    result.push(program);
  }
  return result;
}

function cleanedProgram(archiveProgram) {
  const result = { ...archiveProgram };
  for (const property in result) {
    if (
      ["title", "description", "release", "authors", "images", "urls"].includes(
        property
      )
    )
      continue;
    if (property == "desc") result.description = result.desc;
    if (property == "event")
      result.origin = { type: "gamejam", reference: result.event };
    delete result[property];
  }
  return result;
}

async function fetchROM(file) {
  const response = await fetch(romUrl(file));
  const data = await response.arrayBuffer();
  return new Uint8Array(data);
}

function cleanedROM(archiveProgram) {
  const result = {
    platforms: findPlatforms(archiveProgram),
  };
  for (const property in archiveProgram) {
    if (!Object.keys(allowedROMOptions).includes(property)) continue;
    result[property] = cast(
      archiveProgram[property],
      allowedROMOptions[property]
    );
  }
  for (const property in archiveProgram.options) {
    if (!Object.keys(allowedROMOptions).includes(property)) continue;
    result[property] = cast(
      archiveProgram.options[property],
      allowedROMOptions[property]
    );
  }
  let { backgroundColor, fillColor, fillColor2, blendColor } =
    archiveProgram.options;
  backgroundColor = cast(backgroundColor, "color");
  fillColor = cast(fillColor, "color");
  if (backgroundColor && fillColor) {
    result.colors = {
      pixels: [backgroundColor, fillColor],
      buzzer: cast(archiveProgram.options.buzzColor, "color"),
      silence: cast(archiveProgram.options.quietColor, "color"),
    };
    fillColor2 = cast(fillColor2, "color");
    blendColor = cast(blendColor, "color");
    if (result.platforms.includes("xochip") && fillColor2 && blendColor) {
      result.colors.pixels.push(fillColor2);
      result.colors.pixels.push(blendColor);
    }
  } else {
    delete result.colors;
  }
  if (result.screenRotation == "0") delete result.screenRotation;
  return result;
}

function findPlatforms(archiveProgram) {
  // Find platform from platform property
  const indicatedPlatform =
    {
      chip8: "originalChip8",
      schip: "superchip",
      xochip: "xochip",
    }[archiveProgram.platform] || "modernChip8";

  // Find platform that matches with quirks
  const quirks = getQuirks(archiveProgram.options);
  const quirksPlatform = platforms.find((p) =>
    Object.keys(p.quirks).every((q) => p.quirks[q] == quirks[q])
  )?.id;

  // Find platforms named in description
  const descriptionPlatforms = detectPlatformsInDescription(
    archiveProgram.desc
  );

  const allPlatforms = [
    ...descriptionPlatforms,
    indicatedPlatform,
    quirksPlatform,
  ].filter((p) => p);
  if (allPlatforms.length != 1)
    allPlatforms.push(
      "PLEASE MANUALLY CHECK PLATFORMS, THIS IS PROBABLY WRONG"
    );
  return [...new Set(allPlatforms)];
}

function getQuirks(options) {
  return {
    shift: !!options?.shiftQuirks,
    memoryIncrementByX: false,
    memoryLeaveIUnchanged: !!options?.loadStoreQuirks,
    wrap: "clipQuirks" in options ? !options.clipQuirks : false,
    jump: !!options?.jumpQuirks,
    vblank: !!options?.vBlankQuirks,
    logic: !!options?.logicQuirks,
  };
}

function detectPlatformsInDescription(description) {
  description = description.toLowerCase();
  const platforms = [];
  if (description.includes("superchip") || description.includes("schip"))
    platforms.push("superchip");
  if (description.includes("xo")) platforms.push("xochip");
  if (description.includes("chip-8")) platforms.push("modernChip8");
  return platforms;
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
      if (!input) return input; // Not a valid color, return for the JSON schema to complain about
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

const allowedROMOptions = {
  tickrate: "integer",
  screenRotation: "integer",
  touchInputMode: "string",
  fontStyle: "string",
};
