import path from 'path';
import { ModelHandler } from '../modelProcessing';

export const keyboardsHandler: ModelHandler = {
  category: 'keyboards',
  publicGlbDir: path.join(process.cwd(), 'public/glb/keyboards'),
  srcModelsDir: path.join(process.cwd(), 'src/components/models/keyboards'),

  parseFilename: (filename: string) => {
    const baseName = filename.replace(/-transformed$/, '');
    const parts = baseName.split('_');

    // Define valid layouts and features
    const LAYOUTS = new Set(['60', 'tkl', 'full_size', 'slim', '75', '96']);
    const FEATURES = new Set(['grad', 'rgb', 'wireless', '8008']);

    // Extract layout by finding first valid layout part
    let layout = 'standard';
    let version = 1;
    const colors: string[] = [];
    const features: string[] = [];

    // Special case for full_size layout
    if (parts[0] === 'full' && parts[1] === 'size') {
      layout = 'full_size';
      parts.splice(0, 2);
    }

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].toLowerCase();

      if (LAYOUTS.has(part) && layout === 'standard') {
        layout = part;
      } else if (!isNaN(Number(part)) && i > 0) {
        // Version must come after layout
        version = parseInt(part);
      } else if (FEATURES.has(part)) {
        features.push(part === '8008' ? 'color-8008' : part);
      } else if (part !== 'keyboard') {
        // Skip 'keyboard' in names
        colors.push(part);
      }
    }

    return {
      layout,
      version,
      colors: colors.length > 0 ? colors : ['default'],
      features,
    };
  },

  generateComponentName: (parsedData) => {
    const { layout, version, colors, features } = parsedData;
    const layoutPart = layout === 'full_size' ? 'FullSize' : pascalCase(layout);

    return [
      'Keyboard',
      layoutPart,
      version > 1 ? `V${version}` : '',
      ...colors.map((c: string) => pascalCase(c)),
      ...features.map((f: string) => pascalCase(f)),
    ]
      .filter(Boolean)
      .join('');
  },

  generateModelEntry: (componentName, publicGlbPath, parsedData) => ({
    name: [
      `${parsedData.layout.replace('_', ' ')}% Keyboard`,
      parsedData.version > 1 ? `v${parsedData.version}` : '',
      parsedData.colors.join(' '),
      parsedData.features.length > 0
        ? `(${parsedData.features.join(', ')})`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
    props: {
      model: componentName,
      category: 'keyboards',
      subcategory: parsedData.layout,
      version: parsedData.version,
      colors: parsedData.colors,
      features: parsedData.features,
    },
    glbPath: publicGlbPath,
  }),
};

// Shared helper function
const pascalCase = (str: string) =>
  str.replace(/(^\w|_\w)/g, (m) => m.toUpperCase().replace(/_/g, ''));
