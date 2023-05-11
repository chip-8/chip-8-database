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
database yet, please open an issue or a pull request to add them. So that over
time this database approaches an exhaustive list.

## Use cases

If you're making a CHIP-8 emulator, here are some suggestions and use cases
where this database can come in handy:

- Display the game's `title` and `author` in your emulator.
- Check the `platform` property to make sure your emulator even supports the
  game! If it's a simple CHIP-8 emulator, assert that this is `chip8`. If you've
  made a Super-CHIP emulator, it should be `schip`. There are many weird, valid
  platforms here that you likely don't support.
- Go through the quirks in `options` and make sure you support all the different
  behaviors, and select which behavior to use for this specific game.
- Check the `keys` property to see if it uses a standard WASD-type directional
  movement, and map those keys to the arrow keys for convenience.
- Check `options` for color values, and set your display to use those colors for
  a less boring look.

## Contents

The `database` directory in this repository contains two files:

### `sha1-hashes.json`

[`sha1-hashes.json`](./database/sha1-hashes.json) is a JSON file mapping SHA1
hashes of CHIP-8 ROMs to indices in the `progams.json` array.

### `programs.json`

[`programs.json`](./database/programs.json) is an array of program metadata.

The schema is based on chip8Archive, but is a superset of that file.

- `title`: The full text title of the program.
- `authors`: A list of one or more authors.
- `images`: A list of zero or more filenames inside the directory in src
  corresponding to this entry which can be used to visually represent the
  program in a gallery.
- `description`: A short textual description of the program.
- `event`: A short string identifying any game jam or gathering this program was
  created during.
- `release`: An ISO 8601 date (YYYY-MM-DD) indicating when this program was
  released to the public.
- `platform`: The minimal CHIP-8 platform this program runs on. This is
  independent of behavioral "quirks" of the platform (see below), but hints at
  what extra features and instructions are required to run the program.
  - `chip8`: Basic CHIP-8
  - `schip`: Super-CHIP, extension to CHIP-8 with a high-resolution (128x64)
    display
  - `xochip`: XO-CHIP, extension to Super-CHIP with (chip8, schip, or xochip).
    If the program works on multiple platforms, go with the least powerful it
    works on properly.
- `interpreter`: Original CHIP-8 interpreter this game was written for.
- `options`: Configuration for quirks flags and general interpreter options. See
  below.

#### options

The `options` key holds an object with keys and values.

General options:

- `tickrate` - how many cycles to run per frame?
- `backgroundColor`: The color used for the background, or pixels that are
  "off".
- `fillColor`: The color used for pixels that are "on". For XO-CHIP, this is
  specifically for graphics plane 1.
- `fillColor2`: The color used for pixels that are "on" in graphics plane 2 for
  XO-CHIP.
- `blendColor`: The color used when planes 1 and 2 overlap in XO-CHIP.
- `buzzColor`: For a visual sound buzzer, this is the color used when the buzzer
  is active.
- `quietColor`: The color used when the buzzer is not active.
- `touchInputMode`
- `enableXO`: Whether this game requires XO-CHIP capabilities (such as multiple
  graphics planes).
- `screenRotation`
- `fontStyle`

In addition, there are several options that describe "quirks" that the game
depends on. "Quirks" are behavioral differences. Some CHIP-8 interpreters have
historically implemented certain instructions differently, causing incompatible
CHIP-8 specifications. If a game relies on a certain behavior, these options
tell you that.

The "Default" column gives tips to what a sensible default behavior is, mainly
judged by the number of games in the database that rely on each behavior.

Instructions in this table follow the convention used in
[Mastering CHIP-8](http://mattmik.com/files/chip8/mastering/chip8.html): `NNN`
refers to a hexadecimal memory address, `NN` refers to a hexadecimal byte, `N`
refers to a hexadecimal nibble, and `X` and `Y` refer to hexadecimal register
numbers (where the registers themselves are referred to as `VX` and `VY`).

<!-- prettier-ignore -->
| Key | Instructions affected | true | false | Default |
|-----|-----------------------|------|-------|---------|
| `shiftQuirks` | `8XY6` and `8XYE` | Shift VX and ignore VY | Load VX with the value in VY and then shift VX | Most modern emulators behave as if this were `true`, as does the original Super-CHIP interpreter. The original CHIP-8 emulator behaves as if it were `false`. |
| `loadStoreQuirks` | `FX55` and `FX65` | Do not increment `I` | Increment `I` once per value loaded/stored (eg. `I` will be changed to `I + X + 1` after completion) | Most modern emulators behave as if this were `true`, as does the original Super-CHIP interpreter. The original CHIP-8 emulator behaves as if it were `false`. |
| `jumpQuirks` | `BNNN` | Interpret `BNNN` as `BXNN` and jump to the address `XNN` + VX | Jump to the address `NNN` plus the value in register `V0` | |
| `vBlankQuirks` | `DXYN` | Wait for vertical blank or screen interrupt before drawing (essentially consuming all remaining cycles for this frame, and only allowing one draw operation per frame) | Blit directly to the screen immediately | |
| `logicQuirks` | `8XY1`, `8XY2`, `8XY3` | The VF register's state is undefined afterwards | The VF register is not touched | Likely inconsequential, and can be assumed `false`. |
| `vfOrderQuirks` | | | | | | |
| `clipQuirks` | `DXYN` | | | | | |

## Where to find games

Note that this repository doesn't actually host any games, only metadata! Here
are some places you can find the games listed in this database:

- chip8Archive: A repository containing programs released into the public
  domain. Great for inclusion in any emulator!
- Revival pack: A large game pack purtorting to contain programs in the public
  domain.
- David Winter's CHIP-8 games: A collection of David Winter's games, which are
  traditionally included in many emulators today.
