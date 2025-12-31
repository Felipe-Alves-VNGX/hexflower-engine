# Hex Flower Engine for FoundryVTT

![Foundry Version](https://img.shields.io/badge/Foundry-v11--v12-informational)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

A procedural random event system with memory for tabletop RPGs. Hex Flowers are versatile tools for generating terrain, weather, encounters, and much more in a dynamic and interconnected way.

## What is a Hex Flower?

A **Hex Flower** is a procedural random event "engine" that functions as a type of game system for generating sequences of events, terrain, weather, or dungeon encounters. Unlike traditional random tables, Hex Flowers have an inbuilt "memory" - the last outcome affects the next outcome, creating more logical and immersive sequences.

### Structure

The Hex Flower consists of **19 interconnected hexagons** arranged in a symmetrical configuration:
- One central hexagon
- 18 surrounding hexagons in concentric rings

### Navigation Mechanics

Movement through the Hex Flower is determined by rolling **2d6** and consulting the Navigation Key:

| Roll | Direction | Probability |
|------|-----------|-------------|
| 12 | North (a) | ~2.78% |
| 2-3 | Northeast (b) | ~8.33% |
| 4-5 | Southeast (c) | ~19.44% |
| 6-7 | South (d) | ~30.56% |
| 8-9 | Southwest (e) | ~25% |
| 10-11 | Northwest (f) | ~13.89% |

This probability distribution creates a natural "drift" toward certain directions, making the system more predictable than pure random tables while still maintaining an element of surprise.

## Features

### Core Functionality
- **Create and manage multiple Hex Flowers** with customizable content
- **2d6 Navigation System** with automatic dice rolling and chat integration
- **Axial coordinate system** (q, r) for precise hex positioning
- **Movement history tracking** to review the path taken
- **Edge handling options**: stay in place or wrap to opposite edge

### User Interface
- **Interactive hex grid** with click-to-edit functionality
- **Visual current position indicator** with animated glow effect
- **Probability display** showing navigation chances
- **Navigation key reference** always visible

### Customization
- **Per-hex content**: labels, descriptions, and custom colors
- **Configurable radius** (1-5) for different Hex Flower sizes
- **Import/Export** Hex Flowers as JSON for sharing

### Localization
- Full support for **English** and **Portuguese (Brazil)**
- Easy to add additional languages

## Installation

### Method 1: Foundry Module Browser
1. Open Foundry VTT
2. Go to **Add-on Modules** tab
3. Click **Install Module**
4. Search for "Hex Flower Engine"
5. Click **Install**

### Method 2: Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/hexflower-engine/hexflower-engine/releases)
2. Extract the zip file to your `Data/modules` folder
3. Restart Foundry VTT
4. Enable the module in your world

### Method 3: Manifest URL
Use this URL in Foundry's module installer:
```
https://github.com/hexflower-engine/hexflower-engine/releases/latest/download/module.json
```

## Usage

### Opening the Hex Flower Engine
1. In a scene, look for the **Token Controls** on the left sidebar
2. Click the **hexagon icon** to open the Hex Flower dialog

### Creating a Hex Flower
1. Click **Create New** in the dialog
2. The new Hex Flower will appear with a default radius
3. Click on any hex to edit its content

### Navigation
1. Select a Hex Flower from the dropdown
2. Click **Navigate (2d6)** to roll and move
3. The current position will be highlighted
4. Movement history is tracked below the grid

### Editing Hexes
1. Click on any hex in the grid
2. In the editor dialog:
   - Set a **Label** (short text shown in the hex)
   - Add **Content** (detailed description)
   - Choose a **Color** for visual distinction
3. Click **Save**

### Import/Export
- **Export**: Click the Export button to download the current Hex Flower as JSON
- **Import**: Click Import and select a JSON file to load a Hex Flower

## API Reference

The module exposes an API for macro and module integration:

```javascript
// Access the API
const api = game.modules.get('hexflower-engine').api;

// Create a new Hex Flower
const hexFlower = api.createHexFlower({
  name: "Weather Tracker",
  radius: 2,
  metadata: { type: "weather" }
});

// Navigate (with optional pre-rolled result)
const result = await api.navigate(hexFlower.id);
// Or with a specific roll:
const result = await api.navigate(hexFlower.id, 7);

// Roll navigation dice
const roll = await api.rollNavigation();

// Get current hex
const currentHex = api.getCurrentHex(hexFlower.id);

// Set hex content
api.setHexContent(hexFlower.id, 0, 0, {
  label: "Clear",
  content: "Clear skies, good visibility",
  color: "#87CEEB"
});

// Export/Import
const json = api.exportToJSON(hexFlower.id);
const imported = api.importFromJSON(jsonString);

// Open the dialog
api.openDialog();

// Access constants
console.log(api.NAVIGATION_KEY);
console.log(api.DIRECTION_VECTORS);
```

### Hooks

The module provides several hooks for integration:

```javascript
// When a Hex Flower is created
Hooks.on('hexflower-engine.hexFlowerCreated', (hexFlower) => {
  console.log('Created:', hexFlower.name);
});

// When navigation occurs
Hooks.on('hexflower-engine.hexFlowerNavigated', (hexFlower, targetHex) => {
  console.log('Moved to:', targetHex.q, targetHex.r);
});

// When hex content is updated
Hooks.on('hexflower-engine.hexContentUpdated', (hexFlower, hex) => {
  console.log('Updated hex:', hex.label);
});

// When a Hex Flower is reset
Hooks.on('hexflower-engine.hexFlowerReset', (hexFlower) => {
  console.log('Reset:', hexFlower.name);
});

// When the module is ready
Hooks.on('hexflower-engine.ready', (engine) => {
  console.log('Hex Flower Engine is ready!');
});
```

## Configuration

Access module settings via **Game Settings > Module Settings > Hex Flower Engine**:

| Setting | Description | Default |
|---------|-------------|---------|
| Default Radius | Size of new Hex Flowers (1-5) | 2 |
| Show Navigation Roll | Display 2d6 roll in chat | true |
| Enable Edge Wrapping | Wrap to opposite edge at boundaries | false |
| Animate Movement | Show movement animations | true |

## Use Cases

### Weather Generation
Create a Hex Flower where each hex represents a weather condition. The natural drift of the 2d6 system creates realistic weather patterns that change gradually.

### Terrain Exploration
Use for procedural hex crawl generation where terrain types flow naturally from one to another.

### Mood/Tension Tracker
Track the mood of a scene or NPC, with the Hex Flower representing different emotional states.

### Combat Morale
Monitor enemy morale during combat, with certain hexes triggering retreat or surrender.

### Random Encounters
Create encounter tables with memory, so the party doesn't face the same threats repeatedly.

## Credits

- **Hex Flower concept** popularized by [Goblin's Henchman](https://goblinshenchman.wordpress.com/hex-power-flower/)
- **Hex Flower Cookbook** - comprehensive guide to Hex Flower design
- Built for [Foundry Virtual Tabletop](https://foundryvtt.com/)

## License

This module is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/hexflower-engine/hexflower-engine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hexflower-engine/hexflower-engine/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
