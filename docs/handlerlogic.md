# Custom Model Handler Development Guide

This document explains how to create new model handlers for different asset types (desks, chairs, etc.) while maintaining consistency with the existing system.

## Key Concepts

    Handler Pattern: Each model type uses a handler implementing a common interface

    Separation of Concerns: Generic processing vs model-specific logic

    File Naming Convention: Structured filenames drive automatic processing

    Component Generation: GLB → TSX conversion with props injection

## Handler Interface

All handlers must implement this TypeScript interface:

    ```typescript
interface ModelHandler {
  // Model category (e.g., "displays", "desks")
  category: string;
  
  // Path configuration
  publicGlbDir: string;  // Source GLB directory
  srcModelsDir: string;  // Output TSX directory

  // Core functionality
  parseFilename: (filename: string) => any;
  generateComponentName: (filename: string, parsedData: any) => string;
  generateModelEntry: (
    filename: string,
    componentName: string,
    publicGlbPath: string,
    parsedData: any
  ) => ModelEntry;
}
    ```

## Step-by-Step Handler Creation

### 1. Create Handler File

Create a new file in scripts/handlers/ following the naming convention [modelType]Handler.ts

Example: desksHandler.ts

### 2. Implement Filename Parsing

Requirements:

    Extract model attributes from filename

    Throw clear errors for invalid formats

    Return structured data object

Example Desk Filename:
`desk_rectangular_200cm_180cm_80cm_v2.glb`

Implementation:

    ```typescript
parseFilename: (filename: string) => {
  const baseName = filename.replace(/-transformed$/, '');
  const parts = baseName.split('_');
  
  if (parts.length < 5) {
    throw new Error(`Invalid desk filename: ${filename}`);
  }

  return {
    shape: parts[1],
    length: parseInt(parts[2].replace('in', '')),
    width: parseInt(parts[3].replace('in', '')),
    height: parseInt(parts[4].replace('in', '')),
    version: parts[5] ? parseInt(parts[5].replace('v', '')) : 1
  };
}

    ```

### 3. Component Naming Strategy

Requirements:

    Create unique PascalCase component names

    Include key attributes

    Maintain consistency

Example Desk Output:
`DeskRectangular60x30x29V2`

Implementation:

    ```typescript
generateComponentName: (filename, parsedData) => {
  const { shape, length, width, height, version } = parsedData;
  return [
    'Desk',
    shape.charAt(0).toUpperCase() + shape.slice(1),
    `${length}x${width}x${height}`,
    version > 1 ? `V${version}` : ''
  ].filter(Boolean).join('');
}

    ```

### 4. Model Entry Generation

Requirements:

    Create human-readable display name

    Include all relevant props

    Maintain GLB path reference

Example Desk Entry:

    ```typescript
generateModelEntry: (filename, componentName, publicGlbPath, parsedData) => ({
  name: `Rectangular Desk ${parsedData.length}"L x ${parsedData.width}"W v${parsedData.version}`,
  props: {
    model: componentName,
    category: 'furniture',
    subcategory: 'desks',
    dimensions: {
      length: parsedData.length,
      width: parsedData.width,
      height: parsedData.height
    },
    shape: parsedData.shape
  },
  glbPath: publicGlbPath
})

    ```

### 5. Run the script

You can run specific scripts (if you don't want to wait for other scripts to go) using:

    ```zsh
pnpm run generate --[handler.category]
    ```
Where `handler.category` is the category of your new handler e.g. displays.
