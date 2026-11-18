# Harbor Afterhours

An original open-city crime game with on-foot travel, vehicles, traffic, police, four story missions and local saves.

## Run

Serve `game/` over local HTTP and open its index page in a desktop browser. The game uses the bundled Three.js renderer when WebGL is available and falls back to the overhead view if renderer initialization fails. Play does not require an external network connection.

## Current status

The 3D prototype includes a following camera, city blocks, animated traffic and mission markers. Node regression tests cover entering and exiting cars, movement, mission gating, rewards and save/load. Browser rendering and the feel of the new camera are still unverified. Capture three or four images from the current browser build before creating the competition dossier. The game has not been submitted.

These are experimental competition projects. No prize has been received.

## Repository contents

Source code, the MIT license, and the competition provenance anchor are included. Wallet private keys, API credentials, raw chat logs, transcript bundles, local output folders and machine-specific settings are excluded. Vendored competition helpers retain their original notices.

## License

Game code is MIT licensed. The bundled Three.js distribution retains its license in `game/vendor/LICENSE`.
