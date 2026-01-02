/**
 * Hex Flower Engine for FoundryVTT
 * A procedural random event system with memory for tabletop RPGs
 * 
 * @module hexflower-engine
 * @version 1.0.0
 */

const MODULE_ID = 'hexflower-engine';

/**
 * Navigation directions for hex movement based on 2d6 roll
 * Standard Hex Flower navigation key
 */
const NAVIGATION_KEY = {
  2: 'b',   // Northeast
  3: 'b',   // Northeast
  4: 'c',   // East
  5: 'c',   // East
  6: 'd',   // Southeast
  7: 'd',   // Southeast
  8: 'e',   // Southwest
  9: 'e',   // Southwest
  10: 'f',  // West
  11: 'f',  // West
  12: 'a'   // Northwest
};

/**
 * Direction vectors for axial coordinates (q, r)
 * Using pointy-top hexagon orientation
 */
const DIRECTION_VECTORS = {
  a: { q: 0, r: -1 },   // North
  b: { q: 1, r: -1 },   // Northeast
  c: { q: 1, r: 0 },    // Southeast
  d: { q: 0, r: 1 },    // South
  e: { q: -1, r: 1 },   // Southwest
  f: { q: -1, r: 0 }    // Northwest
};

/**
 * HexFlowerEngine class - Main engine for managing hex flowers
 */
class HexFlowerEngine {
  constructor() {
    this.hexFlowers = new Map();
    this.currentPosition = { q: 0, r: 0 };
    this.history = [];
  }

  /**
   * Initialize the engine
   */
  async initialize() {
    console.log(`${MODULE_ID} | Initializing Hex Flower Engine`);
    this._registerSettings();
    this._registerHooks();
    await this._loadData();
  }

  /**
   * Register module settings
   * @private
   */
  _registerSettings() {
    game.settings.register(MODULE_ID, 'defaultRadius', {
      name: game.i18n.localize('HEXFLOWER.Settings.DefaultRadius.Name'),
      hint: game.i18n.localize('HEXFLOWER.Settings.DefaultRadius.Hint'),
      scope: 'world',
      config: true,
      type: Number,
      default: 2,
      range: {
        min: 1,
        max: 5,
        step: 1
      }
    });

    game.settings.register(MODULE_ID, 'showNavigationRoll', {
      name: game.i18n.localize('HEXFLOWER.Settings.ShowNavigationRoll.Name'),
      hint: game.i18n.localize('HEXFLOWER.Settings.ShowNavigationRoll.Hint'),
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    game.settings.register(MODULE_ID, 'enableEdgeWrapping', {
      name: game.i18n.localize('HEXFLOWER.Settings.EnableEdgeWrapping.Name'),
      hint: game.i18n.localize('HEXFLOWER.Settings.EnableEdgeWrapping.Hint'),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false
    });

    game.settings.register(MODULE_ID, 'animateMovement', {
      name: game.i18n.localize('HEXFLOWER.Settings.AnimateMovement.Name'),
      hint: game.i18n.localize('HEXFLOWER.Settings.AnimateMovement.Hint'),
      scope: 'client',
      config: true,
      type: Boolean,
      default: true
    });

    // Hidden setting for data persistence
    game.settings.register(MODULE_ID, 'hexFlowerData', {
      scope: 'world',
      config: false,
      type: Object,
      default: []
    });
  }

  /**
   * Load saved data
   * @private
   */
  async _loadData() {
    const data = game.settings.get(MODULE_ID, 'hexFlowerData');
    if (data && Array.isArray(data)) {
      this.hexFlowers = new Map(data);
      console.log(`${MODULE_ID} | Loaded ${this.hexFlowers.size} Hex Flowers`);
    }
  }

  /**
   * Save data to settings
   * @private
   */
  async _saveData() {
    const data = Array.from(this.hexFlowers.entries());
    await game.settings.set(MODULE_ID, 'hexFlowerData', data);
  }

  /**
   * Register hooks for the module
   * @private
   */
  _registerHooks() {
    Hooks.on('getSceneControlButtons', (controls) => {
      this._addSceneControls(controls);
    });
  }

  /**
   * Add scene control buttons
   * @param {Array} controls - Scene control buttons array
   * @private
   */
  _addSceneControls(controls) {
    const tokenControls = controls.find(c => c.name === 'token');
    if (tokenControls) {
      tokenControls.tools.push({
        name: 'hexflower',
        title: game.i18n.localize('HEXFLOWER.Controls.OpenHexFlower'),
        icon: 'fas fa-hexagon',
        button: true,
        onClick: () => this.openHexFlowerDialog()
      });
    }
  }

  /**
   * Create a new hex flower with specified parameters
   * @param {Object} options - Hex flower configuration
   * @param {string} options.name - Name of the hex flower
   * @param {number} options.radius - Radius of the hex flower (default: 2)
   * @param {Object} options.metadata - Additional metadata
   * @returns {Object} The created hex flower
   */
  createHexFlower(options = {}) {
    const radius = options.radius || game.settings.get(MODULE_ID, 'defaultRadius');
    const hexFlower = {
      id: foundry.utils.randomID(),
      name: options.name || game.i18n.localize('HEXFLOWER.DefaultName'),
      radius: radius,
      hexes: this._generateHexGrid(radius),
      metadata: options.metadata || {},
      currentPosition: { q: 0, r: 0 },
      history: []
    };

    this.hexFlowers.set(hexFlower.id, hexFlower);
    this._saveData();

    Hooks.callAll(`${MODULE_ID}.hexFlowerCreated`, hexFlower);

    return hexFlower;
  }

  /**
   * Generate a hexagonal grid with axial coordinates
   * @param {number} radius - Radius of the hex flower
   * @returns {Array} Array of hex objects
   * @private
   */
  _generateHexGrid(radius) {
    const hexes = [];

    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);

      for (let r = r1; r <= r2; r++) {
        hexes.push({
          q: q,
          r: r,
          s: -q - r, // Cube coordinate for convenience
          content: null,
          label: '',
          color: null
        });
      }
    }

    return hexes;
  }

  /**
   * Roll 2d6 for navigation
   * @returns {Object} Roll result with total and direction
   */
  async rollNavigation() {
    const roll = new Roll('2d6');
    await roll.evaluate();

    const total = roll.total;
    const direction = NAVIGATION_KEY[total];

    if (game.settings.get(MODULE_ID, 'showNavigationRoll')) {
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker(),
        flavor: game.i18n.format('HEXFLOWER.Chat.NavigationRoll', {
          direction: game.i18n.localize(`HEXFLOWER.Directions.${direction}`)
        })
      });
    }

    return {
      total: total,
      direction: direction,
      roll: roll
    };
  }

  /**
   * Navigate from current position based on a 2d6 roll
   * @param {string} hexFlowerId - ID of the hex flower
   * @param {number} [rollResult] - Optional pre-rolled result (2-12)
   * @returns {Object} New position and hex content
   */
  async navigate(hexFlowerId, rollResult = null) {
    const hexFlower = this.hexFlowers.get(hexFlowerId);
    if (!hexFlower) {
      ui.notifications.error(game.i18n.localize('HEXFLOWER.Errors.HexFlowerNotFound'));
      return null;
    }

    let direction;
    if (rollResult !== null) {
      direction = NAVIGATION_KEY[rollResult];
    } else {
      const navResult = await this.rollNavigation();
      direction = navResult.direction;
    }

    const vector = DIRECTION_VECTORS[direction];
    const newQ = hexFlower.currentPosition.q + vector.q;
    const newR = hexFlower.currentPosition.r + vector.r;

    // Check if new position is within bounds
    const targetHex = hexFlower.hexes.find(h => h.q === newQ && h.r === newR);

    if (targetHex) {
      // Record history
      hexFlower.history.push({
        from: { ...hexFlower.currentPosition },
        to: { q: newQ, r: newR },
        direction: direction,
        timestamp: Date.now()
      });

      // Update position
      hexFlower.currentPosition = { q: newQ, r: newR };

      this._saveData();
      Hooks.callAll(`${MODULE_ID}.hexFlowerNavigated`, hexFlower, targetHex);

      return {
        position: hexFlower.currentPosition,
        hex: targetHex,
        direction: direction
      };
    } else {
      // Handle edge case
      return this._handleEdgeCase(hexFlower, direction);
    }
  }

  /**
   * Handle navigation when hitting the edge of the hex flower
   * @param {Object} hexFlower - The hex flower object
   * @param {string} direction - The attempted direction
   * @returns {Object} Result of edge handling
   * @private
   */
  _handleEdgeCase(hexFlower, direction) {
    const enableWrapping = game.settings.get(MODULE_ID, 'enableEdgeWrapping');

    if (enableWrapping) {
      // Use antipodal wrapping (opposite side of the grid)
      const oppositeQ = -hexFlower.currentPosition.q;
      const oppositeR = -hexFlower.currentPosition.r;

      const oppositeHex = hexFlower.hexes.find(h => h.q === oppositeQ && h.r === oppositeR);

      if (oppositeHex) {
        // Record history for jump
        hexFlower.history.push({
          from: { ...hexFlower.currentPosition },
          to: { q: oppositeQ, r: oppositeR },
          direction: direction,
          type: 'wrap',
          timestamp: Date.now()
        });

        hexFlower.currentPosition = { q: oppositeQ, r: oppositeR };
        this._saveData();

        return {
          position: hexFlower.currentPosition,
          hex: oppositeHex,
          direction: direction,
          wrapped: true
        };
      }
    }

    // Stay in place if no wrapping or antipodal hex not found
    ui.notifications.info(game.i18n.localize('HEXFLOWER.Notifications.EdgeReached'));

    const currentHex = hexFlower.hexes.find(
      h => h.q === hexFlower.currentPosition.q && h.r === hexFlower.currentPosition.r
    );

    return {
      position: hexFlower.currentPosition,
      hex: currentHex,
      direction: direction,
      blocked: true
    };
  }

  /**
   * Set content for a specific hex
   * @param {string} hexFlowerId - ID of the hex flower
   * @param {number} q - Q coordinate
   * @param {number} r - R coordinate
   * @param {Object} content - Content to set
   */
  setHexContent(hexFlowerId, q, r, content) {
    const hexFlower = this.hexFlowers.get(hexFlowerId);
    if (!hexFlower) return;

    const hex = hexFlower.hexes.find(h => h.q === q && h.r === r);
    if (hex) {
      hex.content = content.content || hex.content;
      hex.label = content.label || hex.label;
      hex.color = content.color || hex.color;

      this._saveData();
      Hooks.callAll(`${MODULE_ID}.hexContentUpdated`, hexFlower, hex);
    }
  }

  /**
   * Get the current hex content
   * @param {string} hexFlowerId - ID of the hex flower
   * @returns {Object|null} Current hex or null
   */
  getCurrentHex(hexFlowerId) {
    const hexFlower = this.hexFlowers.get(hexFlowerId);
    if (!hexFlower) return null;

    return hexFlower.hexes.find(
      h => h.q === hexFlower.currentPosition.q && h.r === hexFlower.currentPosition.r
    );
  }

  /**
   * Reset position to center
   * @param {string} hexFlowerId - ID of the hex flower
   */
  resetPosition(hexFlowerId) {
    const hexFlower = this.hexFlowers.get(hexFlowerId);
    if (!hexFlower) return;

    hexFlower.currentPosition = { q: 0, r: 0 };
    hexFlower.history = [];

    this._saveData();
    Hooks.callAll(`${MODULE_ID}.hexFlowerReset`, hexFlower);
  }

  /**
   * Open the hex flower dialog
   */
  openHexFlowerDialog() {
    new HexFlowerDialog(this).render(true);
  }

  /**
   * Export hex flower data to JSON
   * @param {string} hexFlowerId - ID of the hex flower
   * @returns {string} JSON string
   */
  exportToJSON(hexFlowerId) {
    const hexFlower = this.hexFlowers.get(hexFlowerId);
    if (!hexFlower) return null;

    return JSON.stringify(hexFlower, null, 2);
  }

  /**
   * Import hex flower from JSON
   * @param {string} jsonString - JSON string to import
   * @returns {Object} Imported hex flower
   */
  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      data.id = foundry.utils.randomID(); // Generate new ID
      this.hexFlowers.set(data.id, data);
      this._saveData();

      Hooks.callAll(`${MODULE_ID}.hexFlowerImported`, data);

      return data;
    } catch (error) {
      console.error(`${MODULE_ID} | Error importing hex flower:`, error);
      ui.notifications.error(game.i18n.localize('HEXFLOWER.Errors.ImportFailed'));
      return null;
    }
  }

  /**
   * Get navigation probabilities
   * @returns {Object} Probability distribution for each direction
   */
  getNavigationProbabilities() {
    return {
      a: { rolls: [12], probability: 1 / 36 },           // ~2.78%
      b: { rolls: [2, 3], probability: 3 / 36 },         // ~8.33%
      c: { rolls: [4, 5], probability: 7 / 36 },         // ~19.44%
      d: { rolls: [6, 7], probability: 11 / 36 },        // ~30.56%
      e: { rolls: [8, 9], probability: 9 / 36 },         // ~25%
      f: { rolls: [10, 11], probability: 5 / 36 }        // ~13.89%
    };
  }
}

/**
 * HexFlowerDialog - Application for managing hex flowers
 *
 * @extends Application
 */
class HexFlowerDialog extends Application {
  /**
   * Wrapper for the Hex Flower Dialog
   * @param {HexFlowerEngine} engine - The engine instance
   * @param {object} options - Application options
   */
  constructor(engine, options = {}) {
    super(options);
    this.engine = engine;
    this.selectedHexFlower = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'hexflower-dialog',
      title: game.i18n.localize('HEXFLOWER.Dialog.Title'),
      template: `modules/${MODULE_ID}/templates/hexflower-dialog.hbs`,
      classes: ['hexflower-engine', 'dialog'],
      width: 600,
      height: 'auto',
      resizable: true
    });
  }

  getData() {
    return {
      hexFlowers: Array.from(this.engine.hexFlowers.values()),
      selectedHexFlower: this.selectedHexFlower,
      currentHex: this.selectedHexFlower ?
        this.engine.getCurrentHex(this.selectedHexFlower.id) : null,
      probabilities: this.engine.getNavigationProbabilities()
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.create-hexflower').click(this._onCreateHexFlower.bind(this));
    html.find('.navigate-btn').click(this._onNavigate.bind(this));
    html.find('.reset-btn').click(this._onReset.bind(this));
    html.find('.export-btn').click(this._onExport.bind(this));
    html.find('.import-btn').click(this._onImport.bind(this));
    html.find('.hexflower-select').change(this._onSelectHexFlower.bind(this));
    html.find('.hex-cell').click(this._onHexClick.bind(this));
  }

  async _onCreateHexFlower(event) {
    event.preventDefault();

    const hexFlower = this.engine.createHexFlower({
      name: game.i18n.localize('HEXFLOWER.DefaultName')
    });

    this.selectedHexFlower = hexFlower;
    this.render();
  }

  async _onNavigate(event) {
    event.preventDefault();

    if (!this.selectedHexFlower) {
      ui.notifications.warn(game.i18n.localize('HEXFLOWER.Warnings.NoHexFlowerSelected'));
      return;
    }

    await this.engine.navigate(this.selectedHexFlower.id);
    this.render();
  }

  _onReset(event) {
    event.preventDefault();

    if (!this.selectedHexFlower) return;

    this.engine.resetPosition(this.selectedHexFlower.id);
    this.render();
  }

  _onExport(event) {
    event.preventDefault();

    if (!this.selectedHexFlower) return;

    const json = this.engine.exportToJSON(this.selectedHexFlower.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `hexflower-${this.selectedHexFlower.name}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  async _onImport(event) {
    event.preventDefault();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      const text = await file.text();
      const hexFlower = this.engine.importFromJSON(text);

      if (hexFlower) {
        this.selectedHexFlower = hexFlower;
        this.render();
      }
    };

    input.click();
  }

  _onSelectHexFlower(event) {
    const id = event.target.value;
    this.selectedHexFlower = this.engine.hexFlowers.get(id);
    this.render();
  }

  _onHexClick(event) {
    if (!this.selectedHexFlower) return;

    const hex = event.currentTarget;
    const q = parseInt(hex.dataset.q);
    const r = parseInt(hex.dataset.r);

    // Open hex editor dialog
    new HexEditorDialog(this.engine, this.selectedHexFlower.id, q, r).render(true);
  }
}

/**
 * HexEditorDialog - Dialog for editing individual hex content
 */
class HexEditorDialog extends FormApplication {
  constructor(engine, hexFlowerId, q, r, options = {}) {
    super({}, options);
    this.engine = engine;
    this.hexFlowerId = hexFlowerId;
    this.q = q;
    this.r = r;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'hex-editor-dialog',
      title: game.i18n.localize('HEXFLOWER.HexEditor.Title'),
      template: `modules/${MODULE_ID}/templates/hex-editor.hbs`,
      classes: ['hexflower-engine', 'hex-editor'],
      width: 400,
      height: 'auto'
    });
  }

  getData() {
    const hexFlower = this.engine.hexFlowers.get(this.hexFlowerId);
    const hex = hexFlower?.hexes.find(h => h.q === this.q && h.r === this.r);

    return {
      hex: hex,
      q: this.q,
      r: this.r
    };
  }

  async _updateObject(event, formData) {
    this.engine.setHexContent(this.hexFlowerId, this.q, this.r, {
      label: formData.label,
      content: formData.content,
      color: formData.color
    });
  }
}

// ============================================================================
// Module Initialization
// ============================================================================

let hexFlowerEngine;

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing module`);

  // Register Handlebars helpers
  Handlebars.registerHelper('hexflower-eq', (a, b) => a === b);
  Handlebars.registerHelper('hexflower-multiply', (a, b) => a * b);
  Handlebars.registerHelper('hexflower-percent', (value) => `${(value * 100).toFixed(1)}%`);
});

Hooks.once('ready', async () => {
  console.log(`${MODULE_ID} | Module ready`);

  // Initialize the engine
  hexFlowerEngine = new HexFlowerEngine();
  await hexFlowerEngine.initialize();

  // Expose API
  game.modules.get(MODULE_ID).api = {
    engine: hexFlowerEngine,
    createHexFlower: (options) => hexFlowerEngine.createHexFlower(options),
    navigate: (id, roll) => hexFlowerEngine.navigate(id, roll),
    rollNavigation: () => hexFlowerEngine.rollNavigation(),
    getCurrentHex: (id) => hexFlowerEngine.getCurrentHex(id),
    setHexContent: (id, q, r, content) => hexFlowerEngine.setHexContent(id, q, r, content),
    exportToJSON: (id) => hexFlowerEngine.exportToJSON(id),
    importFromJSON: (json) => hexFlowerEngine.importFromJSON(json),
    openDialog: () => hexFlowerEngine.openHexFlowerDialog(),
    NAVIGATION_KEY: NAVIGATION_KEY,
    DIRECTION_VECTORS: DIRECTION_VECTORS
  };

  // Notify that API is ready
  Hooks.callAll(`${MODULE_ID}.ready`, hexFlowerEngine);

  console.log(`${MODULE_ID} | API exposed at game.modules.get('${MODULE_ID}').api`);
});

// Export for ES modules
export { HexFlowerEngine, HexFlowerDialog, HexEditorDialog, NAVIGATION_KEY, DIRECTION_VECTORS };
