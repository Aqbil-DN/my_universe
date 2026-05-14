# 🌌 Awen Universe

> *"A universe built from quiet memories and the kind of beauty that lingers like starlight."*

**Awen Universe** is a fully interactive, immersive 3D web experience designed as a digital tribute. It transforms a simple photo gallery into a breathtaking cosmic journey. Users can explore a dynamically generated galaxy where every "star" is a cherished memory (photo) orbiting around a glowing, beating galactic core.

![Project Preview](/src/assets/logo_tab/awen_galaxy.png)

## ✨ The Theme & Aesthetic

The project embraces a **"Romantic Glassmorphism & Cosmic Neon"** aesthetic.
- **The Core**: A glowing, pulsating sphere radiating fuchsia and purple neon light (UnrealBloomPass).
- **The Memories**: Hundreds of photos dispersed dynamically across the galaxy plane, bordered by crisp white lines.
- **The Atmosphere**: Abstract, translucent nebula clouds and rainbow-colored shooting stars organically passing through the void.
- **The UI**: Sleek, transparent glass panels built with Tailwind CSS that blend seamlessly into the dark background, avoiding distraction.
- **The Sound**: A persistent, looping ambient soundtrack (Snowfall) that enhances the emotional depth of the journey.

## 🚀 Key Features

* **Cinematic Entry & Parametric Roaming**: Upon entering, the camera executes a high-speed zoom into the galaxy using GSAP. It then seamlessly transitions into a mathematical *Lissajous curve* roaming mode—panning, zooming, and orbiting the galaxy automatically in an organic, non-monotonous pattern.
* **Seamless User Override**: The moment a user interacts (clicks or drags), the automated roaming instantly relinquishes control, allowing the user to freely navigate using standard OrbitControls with smooth damping.
* **Optimized Texture Loading**: Photos are loaded in "chunks" with dynamic resizing and aspect-ratio preservation to ensure that even hundreds of images won't crash the browser's WebGL memory limit.
* **Immersive 3D Text**: A sleek, razor-thin 3D text hovering above the galactic core, perfectly integrated into the 3D space so it can be viewed from any angle.

## 🛠️ Technical Fundamentals (Tech Stack)

This project leverages modern web development and WebGL technologies to achieve its high-performance visual fidelity:

* **[React](https://react.dev/)**: Handles the component lifecycle, state management (speed multipliers, loading states, audio play states), and the 2D UI overlay.
* **[Vite](https://vitejs.dev/)**: Provides lightning-fast HMR and handles dynamic asset bundling (`import.meta.glob` is used to automatically parse and load all photos and music files from the `src/assets` directory).
* **[Three.js](https://threejs.org/)**: The backbone of the project. Used to render the 3D scene, geometries (Spheres, Planes, Sprites), and materials.
* **Post-Processing (Three.js)**: Utilizes `EffectComposer`, `RenderPass`, and `UnrealBloomPass` to create the intense, glowing neon effects on the text, galactic core, and particles.
* **[GSAP (GreenSock)](https://gsap.com/)**: Orchestrates the complex, multi-stage camera entry animations and the pulsing UI button effects.
* **[Tailwind CSS](https://tailwindcss.com/)**: Used for rapidly styling the loading screen and the overlay UI, utilizing utility classes for gradients, animations, and typography.

## 📂 Project Structure

```text
galaxy/
├── public/
│   ├── fonts/           # Local 3D font JSON files (bypassing CORS)
│   └── favicon.svg      # Base Vite favicon
├── src/
│   ├── assets/
│   │   ├── music/       # Background music (.mp3, .wav)
│   │   ├── photo/       # Gallery images (automatically imported)
│   │   └── logo_tab/    # Browser tab icon assets
│   ├── App.jsx          # Main application logic (Three.js initialization & React UI)
│   ├── index.css        # Tailwind directives and base CSS
│   └── main.jsx         # React DOM entry point
├── index.html           # HTML template and metadata
└── tailwind.config.js   # Tailwind configuration
```

## 💻 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 📸 How to Add Memories
The application is designed to be fully dynamic. To add new photos to the galaxy, simply drop any `.jpg`, `.png`, or `.jpeg` files into the `src/assets/photo/` directory. The application will automatically detect them, slice them into memory chunks, and inject them into the galaxy orbit on the next refresh!

## You can view the project directly on the web here: https://my-universe-six.vercel.app/
