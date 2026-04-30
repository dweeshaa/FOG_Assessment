# FOG — SDE Intern Online Assessment

## Projects

### Question 1: Game Selection Interface
A card-based game selection UI with:
- **Swipeable card carousel** — drag/swipe or use arrow keys to navigate
- **Video playback** — click a selected card to play a landscape gameplay preview
- **Responsive design** — works on desktop and mobile
- **Smooth animations** — 3D card transforms, parallax depth, particle effects

📁 **Directory:** `question1/`

### Question 2: Dynamic Grid Challenge
A tile-based grid game with:
- **Dynamic grid size** — configure rows/columns (min 10×10, max 30×30)
- **Two patterns** — diagonal stripes (Pattern 1) and concentric rings (Pattern 2)
- **Tile mechanics:**
  - 🔵 Blue = collect for points
  - 🔴 Red = danger (blink animation, lose 1 life)
  - 🟢 Green = safe zone
  - 🟡 Yellow = player position
- **5 lives** and **30-second timer**
- **Auto-transition** from Pattern 1 → Pattern 2 on completion
- **Win/Lose screens** with stats
- **Multiple input methods:** keyboard (WASD/arrows), click, swipe

📁 **Directory:** `question2/`

## Live Demo
🔗 [Live URL](#) *(replace with deployed URL)*

## Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- Canvas API for video generation
- No dependencies or build tools required

## How to Run Locally
Simply open `index.html` in a browser, or use a local server:
```bash
npx serve .
```

## Author
FOG SDE Intern Assessment Submission
