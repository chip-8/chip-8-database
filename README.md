# CHIP-8 database

This repository aims to be a complete database of CHIP-8 game (and other
program/"ROM") metadata.

There are a myriad of different and incompatible CHIP-8 implementations in the
wild, and a many games require instructions to behave in specific ways to run.

If you're implementing a CHIP-8 interpreter/emulator, you can use the files in
this repository to figure out how to make an arbitrary CHIP-8 game run.

## How to use

If you're making a CHIP-8 emulator, here are some suggestions and use cases
where this database can come in handy:

- When your emulator loads a game, generate a SHA1 hash of the binary and look
  it up in `hashes.json` to retrieve its ID. Then look up the ID in
  `programs.json` to retrieve its metadata.
- Check the `platform` property to make sure your emulator even supports the
  game! If it's a simple CHIP-8 emulator, assert that this is `chip8`. If you've
  made a Super-CHIP emulator, it should be `schip`. There are many weird, valid
  platforms here that you likely don't support. Make sure you support the
  `resolution` too.
- Go through the quirks in `options` and make sure you support all the different
  behaviors, and select which behavior to use for this specific game.
- Display the game's `title` in the title bar of your emulator, if applicable.
- Perhaps check the `keys` property to see if it uses a standard WASD-type
  directional movement, and map those keys to the arrow keys for convenience.
- Check `options` for color values, and set your display to use those colors for
  a less boring look.

## Contents

This repository contains two files:

- `hashes.json`: A JSON file mapping SHA1 hashes of CHIP-8 program binary files
  to names (usually their traditional file names)
- `programs.json`: A JSON file mapping CHIP-8 program names to metadata

### `hashes.json`

This is a simple JSON file. The contents of a CHIP-8 binary/ROM is hashed using
SHA1, and mapped to a unique ID string.

When loading a CHIP-8 program, your emulator can do a SHA1 of the loaded bytes,
and look up the string in this file. This string can be displayed in your
emulator, for example. You can then use that string as a lookup ID in
`programs.json` to retrieve additional metadata.

### `programs.json`

This file is a mapping from ID strings to metadata.

The schema is based on chip8Archive, but is a superset of that file.

- `title`: The full text title of the program.
- `authors`: A list of one or more keys for the entries in `authors.json`.
- `images`: A list of zero or more filenames inside the directory in src
  corresponding to this entry which can be used to visually represent the
  program in a gallery.
- `desc`: A short textual description of the program.
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
- `resolution`: The screen resolution required to run this game. This will
  usually be `64x32` for standard CHIP-8 games, `64x64` for "hires"/"two-page"
  CHIP-8 games, and `128x64` for Super-CHIP/XO-CHIP games.
- `keys`: The keys used by this program, and to what purpose. See below.
- `options`: Configuration for quirks flags and general interpreter options. See
  below.

#### keys

This is a list of the hexadecimal keys used, and which keys are used for
directional input.

The keys are strings signifying a direction and the values are numbers between 0
and 16 corresponding to a CHIP-8 key; or the key is "other" and the value is a
list of such keys.

It can be used to map arrow keys to the specific CHIP-8 keys used, for a
seamless and consistent gameplay experience. It is perhaps especially useful for
platforms with limited input capabilities, like for example a console with a
D-pad/joystick and two action buttons; both for mapping keys and to identify
which programs use few enough keys to be playable on such a platform.

| Key   | Value                                                            |
| ----- | ---------------------------------------------------------------- |
| left  | Key used to move left                                            |
| right | Key used to move right                                           |
| up    | Key used to move up                                              |
| down  | Key used to move down                                            |
| nw    | key used to move diagonally up and to the left (North-West)      |
| ne    | key used to move diagonally up and to the right (North-East)     |
| sw    | key used to move diagonally down and to the left (South-West)    |
| se    | key used to move diagonally down and to the right (South-East)   |
| other | A list of other keys used in this program (action keys, perhaps) |

#### options

The `options` key takes a list of keys and values.

General options:

tickrate - how many cycles to run per frame? ":500,

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
- `maxSize`: The memory size needed. A reasonable default is `4096`; this option
  will usually be used for programs that require more memory than `4096`.
  touchInputMode - `enableXO`: Whether this game requires XO-CHIP capabilities
  (such as multiple graphics planes). screenRotation

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

| Key                     | Instructions affected                 | true                                                                                                                                                                   | false                                                                                                                                                     | Default                                                                                                                                                       |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- |
| `shiftQuirks`           | `8XY6` and `8XYE`                     | Shift VX and ignore VY                                                                                                                                                 | Load VX with the value in VY and then shift VX                                                                                                            | Most modern emulators behave as if this were `true`, as does the original Super-CHIP interpreter. The original CHIP-8 emulator behaves as if it were `false`. |
| `loadStoreQuirks`       | `FX55` and `FX65`                     | Do not increment `I`                                                                                                                                                   | Increment `I` once per value loaded/stored (eg. `I` will be changed to `I + X + 1` after completion)                                                      | Most modern emulators behave as if this were `true`, as does the original Super-CHIP interpreter. The original CHIP-8 emulator behaves as if it were `false`. |
| `jumpQuirks`            | `BNNN`                                | Interpret `BNNN` as `BXNN` and jump to the address `XNN` + VX                                                                                                          | Jump to the address `NNN` plus the value in register `V0`                                                                                                 |                                                                                                                                                               |
| `vBlankQuirks`          | `DXYN`                                | Wait for vertical blank or screen interrupt before drawing (essentially consuming all remaining cycles for this frame, and only allowing one draw operation per frame) | Blit directly to the screen immediately                                                                                                                   |                                                                                                                                                               |
| `logicQuirks`           | `8XY1`, `8XY2`, `8XY3`                | The VF register's state is undefined afterwards                                                                                                                        | The VF register is not touched                                                                                                                            | Likely inconsequential, and can be assumed `false`.                                                                                                           |
| `loresWideSpriteQuirks` | `DXY0`                                | Draws a 16x16 sprite even in low-resolution (64x32) mode, row-major                                                                                                    | No operation                                                                                                                                              | This behavior is apparently only found in Octo, but can be assumed `true`.                                                                                    |
| `loresTallSpriteQuirks` | `DXY0`                                | Draws an 8x16 sprite in low-resolution mode                                                                                                                            | No operation                                                                                                                                              | This behavior was used on the DREAM 6800 and in Super-CHIP, but is uncommon and can be assumed `false`.                                                       |
| `collisionQuirks`       | `DXYN`                                | In high-res mode, sets VF to the number of rows that collide or run off the bottom of the screen                                                                       | Always sets VF to 1 if there is a collision, or 0 otherwise                                                                                               | This behavior only appeared in Super-CHIP, but is uncommon and should default to `false`.                                                                     |
| `resizeQuirks`          | `00FE` and `00FF`                     | Clears the screen                                                                                                                                                      | Does not clear the screen, and should not produce a visible effect (assumes that the low-res display represents each CHIP-8 pixel with 2x2 hi-res pixels) | Should default to `true`.                                                                                                                                     |
| `scrollQuirks`          | `00BN`/`00DN`, `00CN`, `00FB`, `00FC` | `00CN` scrolls by N/2 pixels in low-res mode                                                                                                                           |                                                                                                                                                           | Should default to `false`.                                                                                                                                    |
| `vfOrderQuirks`         |                                       |                                                                                                                                                                        |                                                                                                                                                           |                                                                                                                                                               |     |     |
| `clipQuirks`            | `DXYN`                                |                                                                                                                                                                        |                                                                                                                                                           |                                                                                                                                                               |     |     |

Note that the options `loresWideSpriteQuirks` and `loresTallSpriteQuirks` are
incompatible and cannot both be `true`. If both are false, the instruction
`DXY0` should do nothing.

## Where to find games

Note that this repository doesn't actually host any games, only metadata! Here
are some places you can find the games listed in this database:

- chip8Archive: A repository containing programs released into the public
  domain. Great for inclusion in any emulator!
- Revival pack: A large game pack purtorting to contain programs in the public
  domain.
- David Winter's CHIP-8 games: A collection of David Winter's games, which are
  traditionally included in many emulators today.

## History of quirks

Why are there so many incompatible ways to interpret the few instructions of
CHIP-8?

CHIP-8 was created in 1977 by Joseph Weisbecker for an RCA hobby computer called
the COSMAC VIP. VIP users quickly started hacking the small, 512-byte
interpreter to give it additional features, sharing their alterations and games
in the _VIPER_ newsletter.
