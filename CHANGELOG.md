# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-31

### Added
- Initial release of Hex Flower Engine for FoundryVTT
- Core Hex Flower creation and management system
- 2d6 navigation system with standard Hex Flower navigation key
- Axial coordinate system (q, r) for hex positioning
- Interactive hex grid with visual feedback
- Click-to-edit functionality for individual hexes
- Movement history tracking
- Edge handling options (stay in place or wrap)
- Import/Export functionality (JSON format)
- Module settings for customization
- Full localization support (English and Portuguese-BR)
- Comprehensive API for macro and module integration
- Custom hooks for event handling
- CSS styling with dark theme
- Handlebars templates for UI components
- Scene control button integration
- Chat integration for navigation rolls

### Technical
- ES Module architecture
- FoundryVTT v11-v12 compatibility
- Follows FoundryVTT module development best practices
- Semantic versioning

## [Unreleased]

### Planned
- Visual hex flower editor with drag-and-drop
- Preset hex flower templates (weather, terrain, mood)
- Integration with Journal Entries for hex content
- Macro support for quick navigation
- Multiple navigation key configurations
- Hex flower sharing between worlds
