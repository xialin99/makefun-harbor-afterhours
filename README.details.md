# Harbor Afterhours

An original open-city crime game with on-foot travel, vehicles, traffic, police, four story missions and local saves.

## Run

Serve `game/` over local HTTP and open its index page in a desktop browser. The game uses the bundled Three.js renderer when WebGL is available and falls back to the overhead view if renderer initialization fails. Play does not require an external network connection.

Start a new night and press **E** to enter the marked coupe. Hold **W** to accelerate, steer with **A/D**, reverse with **S**, and brake with **Space**. Follow the yellow markers and minimap to the next contact. On foot, use **WASD** and hold **Shift** to sprint. Aim with the mouse and click to fire. Press **P** to pause or **F5** to save. Use **Continue saved story** from the title screen to resume.

## Local verification

With Node.js 24 and Chrome or Chromium installed, set `HARBOR_CHROMIUM` to the browser executable and run `node tests/browser.mjs`. The test opens a temporary headless Chromium profile and verifies keyboard driving, story and police checkpoints, save/load and local requests. Add `--capture` to refresh the four in-browser JPEGs under `screenshots/`.

To package a dossier, set `MAKEFUN_OUTPUT_DIR` to a fresh directory and run `node main.ts`. The package contains the static game, screenshots, and canonical dossier JSON.

## Repository contents

Source code, the MIT license, and the competition provenance anchor are included. Wallet private keys, API credentials, raw chat logs, transcript bundles, local output folders and machine-specific settings are excluded. Vendored competition helpers retain their original notices.

## License

Game code is MIT licensed. The local minified bundle uses Three.js r187 and retains its license in `game/vendor/LICENSE`.
