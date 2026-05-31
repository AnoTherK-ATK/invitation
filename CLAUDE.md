# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page graduation ceremony invitation styled as a fake Linux terminal ("Graduation OS"). Visitors type shell-like commands (`ls`, `cat`, `./rsvp.sh`, `su`, `whoami`, `pwd`, `clear`) to discover event details and RSVP. CRT/scanline aesthetic, green-on-black, mobile-responsive.

## Architecture

Three static files: `index.html` (markup), `styles.css` (CRT/scanline theme), `script.js` (terminal logic). No build step, no dependencies, no framework, no tests. Open `index.html` in a browser to run it; deploy by serving the three files statically.

The runtime is a fake terminal driven by one `keydown` listener on `#cmd-input`:
- **Command dispatch** — `Enter` parses input, splits args, switches on `cmd`. Each command branch prints output. Adding a command = add a branch in this `if/else` chain and register its name in the `commands`/`files` arrays used by Tab completion.
- **Tab completion** — `Tab` matches the current word against `commands` + `files` (first word) or `files` (later words). Keep these arrays in sync when adding commands/files.
- **Output** — `typeLine()` animates text char-by-char with a blinking cursor; `printHTML()` injects raw HTML instantly (use for links). During output, `isTyping` gates input and hides the prompt.
- **State** — `currentUser` (changed by `su`, read by `whoami`/`pwd`/`./rsvp.sh`) and the prompt label are the only mutable state. No persistence, no backend.

## Content to fill in

Event data is hardcoded inside the `cat event_info.txt` branch (date, time, location, Maps link). The RSVP link in the `./rsvp.sh` branch is a placeholder (`href="#"`, "might add later") — replace with the real Google Form URL before sharing.

## Notes

The `<title>` and on-screen `K` initials are personalization points.
