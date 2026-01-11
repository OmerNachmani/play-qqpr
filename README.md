# play-qqpr

Play QQPR animated ASCII art in your terminal (by animation ID).

## Quick start (no install)

Run directly with `npx`:

```bash
npx play-qqpr 1000
npx play-qqpr 1044 --fps 12
```

## Install

Global install:

```bash
npm i -g play-qqpr
play-qqpr 1000
```

## Usage

```bash
play-qqpr <id> [--fps N] [--cache-dir PATH] [--no-download]
play-qqpr --list
play-qqpr --clear-cache
```

### Examples

```bash
play-qqpr 1044
play-qqpr 1012 --fps 6
play-qqpr --list
play-qqpr --clear-cache
```

## Options

- `--fps N`  
  Frames per second (default: 10)

- `--cache-dir PATH`  
  Override cache directory

- `--no-download`  
  Only play if the file is already cached (do not fetch from the network)

- `--list`  
  List cached animation IDs

- `--clear-cache`  
  Delete cached animation files

## Cache location

By default, cache files are stored in:

- `$XDG_CACHE_HOME/play-qqpr` (if set), otherwise
- `~/.cache/play-qqpr`

Each animation is saved as `<id>.js` in that directory.

## Notes / Credits

This tool downloads animation scripts from qqpr.com at runtime and caches them locally.  
QQPR animated ASCII art gallery: https://www.qqpr.com/animated-ascii-art.html

## License

MIT

## Run from GitHub (no npm publish)

Clone and run:

```bash
git clone https://github.com/OmerNachmani/play-qqpr.git
cd play-qqpr
node ./bin/play-qqpr.mjs 1000

Optional: make it a local command:

chmod +x ./bin/play-qqpr.mjs
./bin/play-qqpr.mjs 1044

