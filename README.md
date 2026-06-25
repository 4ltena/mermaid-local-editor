# Mermaid Local Editor

A fully local, cross-platform Mermaid diagram editor (a desktop mermaid.live),
built with Electron + Vite + TypeScript. CodeMirror editor with live preview,
themes, pan/zoom, SVG/PNG export, and localStorage persistence. No network
access required — mermaid and CodeMirror are bundled.

## Develop

```bash
npm install
npm run dev        # launches the Electron app with HMR
```

## Quality

```bash
npm run typecheck  # tsc for renderer + electron
npm test           # vitest (path-resolver unit test)
npm run build      # electron-vite build -> out/
```

## Package (local)

```bash
npm run dist:mac   # release/*.dmg, *.zip, *.app   (run on macOS)
npm run dist:win   # release/*.exe (nsis)           (run on Windows)
npm run dist:linux # release/*.AppImage, *.deb, *.rpm, *.pacman (run on Linux)
```

Native apps can only be built on their own OS. Use CI for cross-platform.

## Release (CI/CD)

Releases are produced by GitHub Actions on a version tag:

```bash
# bump "version" in package.json to match, then:
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` builds macOS (dmg/zip), Windows (nsis), and
Linux (AppImage/deb/rpm/pacman) and publishes them to the GitHub Release.
Linux mapping: Ubuntu=`.deb`, AlmaLinux=`.rpm`, Arch=`pacman` (AppImage is the
universal fallback). Builds are currently unsigned.
