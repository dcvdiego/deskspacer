import path from 'path';
import { ModelHandler } from '../modelProcessing';

export const miceHandler: ModelHandler = {
  category: 'mice',
  publicGlbDir: path.join(process.cwd(), 'public/glb/mice'),
  srcModelsDir: path.join(process.cwd(), 'src/components/models/mice'),

  parseFilename: (filename: string) => {
    const baseName = filename.replace(/-transformed$/, '');
    const parts = baseName.split('_');
    const BRANDS = new Set(['logitech', 'razer', 'steelseries']); // Add more brands as needed

    let version = 1;
    let brand: string | null = null;
    const features: string[] = [];
    let dimensions: { depth: number; width: number; height: number } | null =
      null;

    // Version is always the first number after "mouse"
    const versionIndex = parts.findIndex((p) => !isNaN(Number(p)));
    if (versionIndex !== -1) {
      version = parseInt(parts[versionIndex]);
      parts.splice(versionIndex, 1);
    }

    // Check for brand name
    const brandPart = parts.find((p) => BRANDS.has(p.toLowerCase()));
    if (brandPart) {
      brand = brandPart;
      parts.splice(parts.indexOf(brandPart), 1);
    }

    // Process remaining parts
    parts.forEach((p) => {
      const dimMatch = RegExp(/([0-9.]+)Dx([0-9.]+)Wx([0-9.]+)H/).exec(p);
      if (dimMatch) {
        dimensions = {
          depth: parseFloat(dimMatch[1]),
          width: parseFloat(dimMatch[2]),
          height: parseFloat(dimMatch[3]),
        };
      } else if (p !== 'mouse') {
        features.push(p);
      }
    });

    return {
      version,
      brand,
      features,
      dimensions,
    };
  },

  generateComponentName: (parsedData) => {
    const { version, brand, features, dimensions } = parsedData;
    const brandPart = brand ? pascalCase(brand) : '';
    const featurePart = features.map(pascalCase).join('');
    const dimPart = dimensions
      ? `${cleanNumber(dimensions.depth)}Dx${cleanNumber(
          dimensions.width
        )}Wx${cleanNumber(dimensions.height)}H`
      : '';

    return ['Mouse', brandPart, `V${version}`, featurePart, dimPart]
      .filter(Boolean)
      .join('');
  },

  generateModelEntry: (componentName, publicGlbPath, parsedData) => ({
    name: [
      parsedData.brand || 'Mouse',
      `v${parsedData.version}`,
      parsedData.dimensions ? formatDimensions(parsedData.dimensions) : '',
      parsedData.features.length > 0
        ? `(${parsedData.features.join(', ')})`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
    props: {
      model: componentName,
      category: 'mice',
      version: parsedData.version,
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

const formatDimensions = (dims: {
  depth: number;
  width: number;
  height: number;
}) => `${dims.depth}cm D × ${dims.width}cm W × ${dims.height}cm H`;
