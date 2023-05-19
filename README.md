# CHIP-8 database

_A repository full of CHIP-8 metadata_

CHIP-8 was created in 1977 by Joseph Weisbecker for an RCA hobby computer called
the COSMAC VIP. VIP users quickly started hacking the small, 512-byte
interpreter to give it additional features, sharing their alterations and games
in the _VIPER_ newsletter.

Over the years, this has resulted in a myriad of different and incompatible
CHIP-8 implementations in the wild, and many games require specific versions or
combinations of settings to run.

This database allows you to look up those versions and settings so your
interpreter can reconfigure itself according to the needs of a given ROM.
Without having to bother the user.

## How does it work?

When loading a CHIP-8 program, your emulator can calculate a SHA1 hash of the
loaded bytes, and look up the hash to retrieve the program name, original
platform type and other metadata.

This database is a work in progress. So if you run into ROMs that are not in the
database yet, or if you find information that is not correct, please open an
issue or a pull request to add them. So that over time this database approaches
a reliable and exhaustive list.

## Use cases

If you're making a CHIP-8 emulator, here are some suggestions and use cases
where this database can come in handy:

- Display the game's title, author, release date and description in your
  emulator.
- Check the `platforms` property to make sure your emulator even supports the
  game!
- Check the `keys` property to see if you can map some keyboard keys (or maybe
  you support a game controller?) to CHIP-8 keys for convenience.
- Find color values, and set your display to use those colors for a less boring
  look.

## Contents

The database consists of four JSON files, each with their own structure:

<!-- prettier-ignore -->
| JSON file |    Definition     | Description |
| --------- | ----------------- | ----------- |
| [`programs.json`](./database/programs.json) | [JSON schema](./schemas/programs.json) | Contains information about CHIP-8 programs and ROMs, like name, author, date of release, which different ROMs exist for the same program, what platforms those ROMs were written for, which keys are used and much more. |
| [`sha1-hashes.json`](./database/sha1-hashes.json) | [JSON schema](./schemas/sha1-hashes.json) | Contains a mapping of SHA1 hashes to indices in the `programs.json` file, for looking up a binary. |
| [`platforms.json`](./database/platforms.json) | [JSON schema](./schemas/platforms.json) | Contains a list of platforms that the programs in `programs.json` were written for. Each program lists which platforms it supports, which you can then look up in this file. |
| [`quirks.json`](./database/quirks.json) | [JSON schema](./schemas/quirks.json) | Contains a list of "quirks", which are differences in behaviour between different platforms. Platforms not only differ in features and instruction set, but also in the way the interpret the instructions. These differences are described in this file, and referenced in `platforms.json` (and sometimes in `programs.json`). |

See the JSON schema definition files for detailed information on each field in
each file.

## How to use the CHIP-8 database

Querying the CHIP-8 database is done in five steps:

1. Calculate the SHA1 hash of a ROM file
2. Look up the SHA1 hash in `sha1-hashes.json`, which gives you an index
3. Use the index to find the program metadata in the `programs.json` file
4. Find the ROM metadata in the `roms` list of the program metadata
5. Configure your interpreter to run the ROM using `platforms.json` and
   `quirks.json`

If you're the kind of person who just wants to see some code, check out the
[examples](./examples/) in this repository. Otherwise, read on!

### Example: Space Invaders

Let's walk through all five steps for the original Space Invaders ROM by David
Winter. First, we have to take the SHA1 hash over all the bytes in the ROM. This
results in this hash:

```
5c28a5f85289c9d859f95fd5eadbdcb1c30bb08b
```

Next, we look this hash up in `sha1-hashes.json`, and at the time of writing
this results in the value `65`. This may be a different value when you're going
through these steps. The `sha1-hashes.json` file gets generated from the data in
`programs.json`, and it changes when that file changes.

```json
{
  ...
  "726cb39afa7e17725af7fab37d153277d86bff77": "63",
  "ed829190e37815771e7a8c675ba0074996a2ddb0": "64",
  "5c28a5f85289c9d859f95fd5eadbdcb1c30bb08b": "65", // <-- here it is!
  "f100197f0f2f05b4f3c8c31ab9c2c3930d3e9571": "65",
  "1bd92042717c3bc4f7f34cab34be2887145a6704": "66",
  ...
}
```

Then, because we found the value `65`, we look up the 65th entry in the array in
`programs.json`, and we find this:

```json
{
  "title": "Space Invaders",
  "description": "Space Invaders (1978), by David Winter\n\nThe well known game. Destroy the invaders with your ship. Shoot with 5, move with 4 and 6. Press 5 to begin a game.",
  "authors": ["David Winter"],
  "release": "1978",
  "roms": {
    "5c28a5f85289c9d859f95fd5eadbdcb1c30bb08b": {
      "file": "Space Invaders [David Winter].ch8",
      "platforms": ["superchip"],
      "embeddedTitle": "SPACE INVADERS 0.91 By David WINTER",
      "keys": {
        "left": 4,
        "right": 6,
        "a": 5
      }
    },
    "f100197f0f2f05b4f3c8c31ab9c2c3930d3e9571": {
      "file": "Space Invaders [David Winter] (alt).ch8",
      "platforms": ["superchip"],
      "keys": {
        "left": 4,
        "right": 6,
        "a": 5
      }
    }
  }
}
```

This program object gives us the title, the author and year of release as well
as a description. For other ROMs there may be more fields. See the JSON schema
files in the table above for all properties in the different files.

It also contains a property called `roms`, which maps SHA1 hashes to a ROM
object. As you can see, the hash for our ROM maps to the first object:

```json
{
  "file": "Space Invaders [David Winter].ch8",
  "platforms": ["superchip"],
  "embeddedTitle": "SPACE INVADERS 0.91 By David WINTER",
  "keys": {
    "left": 4,
    "right": 6,
    "a": 5
  }
}
```

This ROM object gives us even more information about this specific ROM, like the
platforms that it can run on, the keypad or keyboard mappings to play the game,
how the title is originally embedded in the binary, the desired tick rate, the
colors to use and more.

Note that if there are multiple entries in the `platforms` list, they are sorted
by "most desired to least desired". For example; if a game was written for
Superchip, but it happens to run just as well on regular CHIP-8, then Superchip
will come first because that is more "canonical". If a game runs on Superchip,
but it has a few minor bugs in Superchip that don't show up when you run it as
XO-CHIP, then XO-CHIP will be first in the list. So in that case: if you support
XO-CHIP, use that. Otherwise, it's also fine to fall back to Superchip.

Finally, we use the chosen platform and the other metadata in the ROM object to
configure our interpreter. The `platforms.json` and `quirks.json` files may be
of help here.

The `platforms` list in the ROM object references IDs of platforms from the file
`platforms.json`. If we look at the definition for `superchip` for Space
Invaders, we find this:

```json
{
  "id": "superchip",
  "name": "Superchip 1.1",
  "description": "Superchip 1.1 is the platform that most \"superchip\" interpreters implement, because it is the latest version and also because the difference between Superchip version 1.0 and 1.1 is pretty small. This version is faster than its predecessor and adds scroll instructions and a large numeric font. It does however introduces a new quirk by not incrementing the index register when reading or writing registers to memory.",
  "release": "1991-05-24",
  "authors": ["Erik Bryntse"],
  "displayResolutions": ["64x32", "128x64"],
  "defaultTickrate": 30,
  "quirks": {
    "shift": true,
    "memoryLeaveIUnchanged": true,
    "wrap": false,
    "jump": true,
    "vblank": false,
    "logic": false
  }
}
```

We see that we can find some generic information about the platform that we
could show to the user of our interpreter. It also holds the resolutions,
"quirks" and default tick rate. If the ROM does not specify a desired tick rate,
we can use this default one from the platform.

The quirks reference IDs in the file `quirks.json`. Let's take the `shift` quirk
as an example:

```json
{
  "id": "shift",
  "name": "Shift quirk",
  "description": "On most systems the shift opcodes take `vY` as input and stores the shifted version of `vY` into `vX`. The interpreters for the HP48 took `vX` as both the input and the output, introducing the shift quirk.",
  "default": false,
  "ifTrue": "Opcodes `8XY6` and `8XYE` take `vX` as both input and output",
  "ifFalse": "Opcodes `8XY6` and `8XYE` take `vY` as input and `vX` as output"
}
```

This tells us that we need to reconfigure the input register for the shift
opcodes to properly interpret Superchip.

So in the end, we can use all of this information to properly configure our
interpreter, and we can show the user that they have just loaded the game Space
Invaders by David Winter.

And when they press play, everything just runs like magic 🪄

## Where to find games

Note that this repository doesn't actually host any games, only metadata! Here
are some places you can find the games listed in this database:

- [chip8Archive](https://johnearnest.github.io/chip8Archive/): A repository
  containing programs released into the public domain. Great for inclusion in
  any emulator!
- Revival pack: A large game pack purtorting to contain programs in the public
  domain.
- [David Winter's CHIP-8 games](https://www.pong-story.com/chip8/): A collection
  of David Winter's games, which are traditionally included in many emulators
  today.
