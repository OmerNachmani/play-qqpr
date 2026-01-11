# play-qqpr

Play QQPR animated ASCII art in your terminal (by animation ID).

## Install

```bash
git clone https://github.com/OmerNachmani/play-qqpr.git
cd play-qqpr
chmod +x bin/play-qqpr.mjs

# Add to your PATH (add this line to ~/.bashrc or ~/.zshrc):
export PATH="$PATH:$HOME/play-qqpr/bin"
```

Or create a symlink in a directory already in your PATH:

```bash
ln -s "$PWD/bin/play-qqpr.mjs" ~/.local/bin/play-qqpr
```

Then you can run `play-qqpr` from anywhere.

## Usage

```bash
play-qqpr <id> [--fps N] [--loop N] [--cache-dir PATH] [--no-download]
play-qqpr --random [--fps N] [--loop N]
play-qqpr --list
play-qqpr --info <id>
play-qqpr --clear-cache
```

### Examples

```bash
play-qqpr 1044
play-qqpr 1012 --fps 6 --loop 3
play-qqpr --random
play-qqpr --info 1044
play-qqpr --list
play-qqpr --clear-cache
```

## Options

- `--fps N`  
  Frames per second (default: 10)

- `--loop N`  
  Loop the animation N times then exit (default: infinite)

- `--random`  
  Play a random animation from the cache

- `--info <id>`  
  Show info about a cached animation (frame count, duration)

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

