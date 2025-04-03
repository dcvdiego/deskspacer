import path from 'path';
import { ModelHandler } from '../modelProcessing';

// TODO: Fix undefined subcategory (should be features maybe) fix mousepads/mousepads

export const mousepadsHandler: ModelHandler = {
  category: 'mousepads',
  publicGlbDir: path.join(process.cwd(), 'public/glb/mousepads'),
  srcModelsDir: path.join(process.cwd(), 'src/components/models/mousepads'),

  parseFilename: (filename: string) => {
    const baseName = filename.replace(/-transformed$/, '');
    const parts = baseName.split('_');
    const BRANDS = new Set(['qck']); // Add more brands as needed

    let size = 'medium';
    let brand: string | null = null;
    const features: string[] = [];
    let dimensions: { depth: number; width: number } | null = null;

    // First part is always size
    if (parts.length > 0) {
      size = parts[0].toLowerCase();
    }

    // Find mousepad position
    const mousepadIndex = parts.findIndex(
      (p) => p.toLowerCase() === 'mousepad'
    );

    // Process elements between size and mousepad
    if (mousepadIndex > 0) {
      const middleParts = parts.slice(1, mousepadIndex);
      for (const part of middleParts) {
        if (BRANDS.has(part.toLowerCase())) {
          brand = part;
        } else {
          features.push(part);
        }
      }
    }

    // Process elements after mousepad
    if (mousepadIndex !== -1 && mousepadIndex < parts.length - 1) {
      const postMousepad = parts.slice(mousepadIndex + 1);
      for (const part of postMousepad) {
        const dimMatch = RegExp(/([0-9.]+)Dx([0-9.]+)W/).exec(part);
        if (dimMatch) {
          dimensions = {
            depth: parseFloat(dimMatch[1]),
            width: parseFloat(dimMatch[2]),
          };
        } else {
          features.push(part);
        }
      }
    }

    return {
      size,
      brand,
      features,
      dimensions,
    };
  },

  generateComponentName: (parsedData) => {
    const { size, brand, features, dimensions } = parsedData;
    const sizePart = pascalCase(size);
    const brandPart = brand ? pascalCase(brand) : '';
    const featurePart = features.map(pascalCase).join('');
    const dimPart = dimensions
      ? `${cleanNumber(dimensions.depth)}Dx${cleanNumber(dimensions.width)}W`
      : '';

    return ['Mousepad', sizePart, brandPart, featurePart, dimPart]
      .filter(Boolean)
      .join('');
  },

  generateModelEntry: (componentName, publicGlbPath, parsedData) => ({
    name: [
      pascalCase(parsedData.size),
      parsedData.brand ? pascalCase(parsedData.brand) : '',
      'Mousepad',
      parsedData.dimensions ? formatDimensions(parsedData.dimensions) : '',
      parsedData.features.length > 0
        ? `(${parsedData.features.join(', ')})`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
    props: {
      model: componentName,
      category: 'mousepads',
      size: parsedData.size,
      ...(parsedData.brand && { brand: parsedData.brand }),
      ...(parsedData.features.length > 0 && { features: parsedData.features }),
      ...(parsedData.dimensions && { dimensions: parsedData.dimensions }),
    },
    glbPath: publicGlbPath,
  }),
};

// Helper functions
const pascalCase = (str: string) =>
  str.replace(/(^\w|_\w)/g, (m) => m.toUpperCase().replace(/_/g, ''));

const cleanNumber = (num: number) =>
  Number.isInteger(num) ? num.toString() : num.toFixed(2).replace('.', '_');

const formatDimensions = (dims: { depth: number; width: number }) =>
  `${dims.depth}cm D × ${dims.width}cm W`;
