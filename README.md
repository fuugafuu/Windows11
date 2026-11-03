# Windows11 Lab — Virtual UEFI BIOS

A responsive, interactive **UEFI firmware setup simulator** built with HTML, CSS, and JavaScript. This repository currently contains **the BIOS/UEFI stage only**; a Windows 11-like OS is not implemented yet.

## Run

Open `index.html` in a modern desktop or mobile browser. No build tools, server, or external dependencies are required.

To publish via GitHub Pages: Repository **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**.

## Features

- Classic UEFI setup layout: Main, Advanced, Chipset, Security, Boot, Save & Exit.
- Nested configuration pages, contextual help, selection and setting editors.
- BIOS keyboard shortcuts (arrows, Enter, Esc, F1, F9, F10), mouse and touchscreen controls.
- Simulated Secure Boot / CSM dependencies, TPM, virtualization, storage, fan and boot options.
- Simulated boot priority and Boot Override; interactive virtual POST and boot failure/no-OS flow.
- Save, discard, factory defaults and user defaults via browser localStorage.
- Responsive design and on-screen keys for smartphones.

## Important limits

This is **not** the firmware from a specific motherboard and does **not** provide a hardware-level UEFI implementation, real POST, real TPM, flash operations or an OS. Displayed hardware readings and boot devices are intentionally fictional. All configuration changes remain in your browser only.

## Files

- `index.html` — application shell
- `styles.css` — desktop and mobile styling
- `app.js` — menu definitions, simulated firmware settings and navigation
