# Voxel Sandbox

Minecraft-inspired browser sandbox built with Three.js. Explore, fly, and sculpt the voxel world directly in your browser.

## Features

- First-person pointer-lock controls with WASD flight movement
- Interactive block destruction (left click) and block placement (right click)
- Hotbar inventory with five block types: grass, dirt, stone, planks, and translucent glass
- Wireframe targeting highlight for precise editing
- Procedurally generated grassy plateau with small mounds and dynamic sunlight

## Run Locally

```bash
npm install
npm start
```

This launches a static dev server on `http://localhost:3000`. Click the "Click to Start" button to lock the mouse, then build away.

## Deploy

The app is static and ready for Vercel. From the project root:

```bash
npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-f015ce92
```

After the deployment finishes, verify with:

```bash
curl https://agentic-f015ce92.vercel.app
```

## Controls

- `Click` start button – enter pointer-lock view
- `WASD` – move across the terrain
- `Space / Shift` – fly up / down
- `Left click` – remove highlighted block (foundation layer is protected)
- `Right click` – place the selected block
- `1-5` – swap active block type
- `Esc` – release pointer lock

## Folder Layout

```
.
├── index.html
├── main.js
├── package.json
├── README.md
└── style.css
```

Everything runs directly in the browser via ES modules loaded from a CDN—no bundler required.
