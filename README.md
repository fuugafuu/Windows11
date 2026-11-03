# Virtual Windows 11 — UEFI + Web Desktop (v0.2)

UEFI BIOS setup and a Windows 11-inspired browser desktop. This is a **simulation**, not Microsoft Windows, and not a real firmware/CPU emulator. No Windows binaries are run and no hardware settings are modified.

## Run

- Online: enable GitHub Pages, `main` / root. HTTPS is recommended for IndexedDB persistence and service APIs.
- Local: unzip and run `python -m http.server 8000` from the project directory; open `http://localhost:8000`. Opening `index.html` directly may work with reduced storage/manifest handling.
- At power-on: press F2/Delete or tap UEFI Setup; select Boot SSD or save with F10 to load the virtual OS.

## Implemented

- Firmware: Main, Advanced, Chipset, Security, Boot, Save & Exit, editable virtual settings, local NVRAM, Secure Boot/CSM logic, keyboard and mobile touchscreen navigation; no webpage scrolling.
- Boot Manager: reads `boot-manifest.json`, mounts virtual disk in IndexedDB, loads user preferences, then mounts the desktop; failed manifest loading triggers recovery UI (no fake fixed boot delay).
- OS prototype: desktop, taskbar/clock, Start menu, draggable/maximizable/minimizable windows, File Explorer, folder creation, persistent Notepad files, Settings, browser link launcher, and UEFI return.
- Responsive mobile UI with viewport-fitted firmware and app windows.

## Technical limitations

- The firmware does **not** enumerate actual devices, configure real TPM/Secure Boot, or flash real hardware.
- The OS does **not** use Windows NT; it cannot run .exe drivers/apps. IndexedDB stores files only in the current browser origin/profile; clearing site data removes them.
- Recycle Bin is a placeholder. This stage does not implement file deletion, sign-in, networking within a virtual machine, or an actual operating-system kernel.
- The BIOS GUI is modeled after classic Aptio-style firmware, not a pixel-exact reproduction of a specific motherboard.
- Wallpaper: an original SVG inspired by Microsoft's Windows 11 Bloom visual style, not a copied Microsoft binary. Official design background: https://news.microsoft.com/windows11-general-availability/

## Source map

- `index.html`: root document and firmware DOM.
- `app.js`: UEFI settings, navigation and simulated NVRAM.
- `styles.css`: BIOS/base styles.
- `shell.css`: screen-fit overrides and Windows-inspired styling.
- `shell.js`: virtual disk, boot, desktop, apps.
- `boot-manifest.json`: manifest read during boot.
- `assets/bloom.svg`: custom wallpaper asset.

Designed as an educational interactive simulation and not affiliated with Microsoft, AMI or other firmware vendors.