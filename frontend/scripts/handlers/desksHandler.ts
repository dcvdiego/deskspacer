import path from 'path';
import { ModelHandler } from '../modelProcessing';

export const desksHandler: ModelHandler = {
  category: 'desks',
  publicGlbDir: path.join(process.cwd(), 'public/glb/desks'),
  srcModelsDir: path.join(process.cwd(), 'src/components/models/desks'),

  parseFilename: (filename: string) => {
    const baseName = filename.replace(/-transformed$/, '');
    const parts = baseName.split('_');

    // If the first two parts are "L" and "shaped", merge them to form "L_shaped".
    if (parts[0] === 'L' && parts[1] === 'shaped') {
      parts[0] = 'L_shaped';
      parts.splice(1, 1); // remove the second part
    }

    // Look for the dimension string (format: ##Dx##Wx##H).
    const dimensionPart = parts.find((p) =>
      /[0-9.]+Dx[0-9.]+Wx[0-9.]+H/.test(p)
    );
    // Find a part that is a number for versioning.
    const versionPart = parts.find((p) => !isNaN(parseInt(p)));

    return {
      type: parts[0], // e.g., "standing", "L_shaped", "regular"
      style: parts.find((p) => p.includes('desk')) ?? 'desk',
      version: versionPart ? parseInt(versionPart) : 1,
      dimensions: dimensionPart ? parseDimensions(dimensionPart) : null,
      material:
        parts.find((p) => p.includes('-'))?.replace(/-/g, ' ') ?? 'default',
      orientation: parts.includes('left')
        ? 'left'
        : parts.includes('right')
        ? 'right'
        : 'standard',
    };
  },

  generateComponentName: (parsedData) => {
    const { type, dimensions, version, material, orientation } = parsedData;
    const dimString = dimensions
      ? `${cleanNumber(dimensions.depth)}Dx${cleanNumber(
          dimensions.width
        )}Wx${cleanNumber(dimensions.height)}H`
      : '';

    // For valid TSX file names, replace spaces with underscores.
    // Also, if this is an L_shaped desk, include the orientation in the file name.
    return [
      'Desk',
      pascalCase(type),
      dimString,
      version > 1 ? `V${version}` : '',
      pascalCase(material).replace(/\s+/g, '_'),
      type === 'L_shaped' ? orientation : '',
    ]
      .filter(Boolean)
      .join('');
  },

  generateModelEntry: (componentName, publicGlbPath, parsedData) => ({
    // Build a human-readable name. For L_shaped desks, include the orientation so both variants differ.
    name: [
      pascalCase(parsedData.type),
      'Desk',
      parsedData.dimensions ? formatDimensions(parsedData.dimensions) : '',
      parsedData.version > 1 ? `v${parsedData.version}` : '',
      parsedData.material,
      parsedData.type === 'L_shaped' ? parsedData.orientation : '',
    ]
      .filter(Boolean)
      .join(' '),
    props: {
      model: componentName,
      category: 'desks',
      subcategory: parsedData.type.toLowerCase(),
      // Keep dimensions as an object (with numbers) in the props.
      ...(parsedData.dimensions && { dimensions: parsedData.dimensions }),
      material: parsedData.material,
      version: parsedData.version,
      orientation: parsedData.orientation,
    },
    glbPath: publicGlbPath,
  }),
};

// Helper: parse a dimension string of the format ##Dx##Wx##H.
const parseDimensions = (dimStr: string) => {
  const matches = RegExp(/([0-9.]+)Dx([0-9.]+)Wx([0-9.]+)H/).exec(dimStr);
  return matches
    ? {
        depth: parseFloat(matches[1]),
        width: parseFloat(matches[2]),
        height: parseFloat(matches[3]),
      }
    : null;
};

// Convert numbers to strings without periods for file names.
const cleanNumber = (num: number) =>
  Number.isInteger(num) ? num.toString() : num.toFixed(2).replace('.', '_');

// Convert a string to PascalCase. This version capitalizes each match and removes dashes.
const pascalCase = (str: string) =>
  str.replace(/(^\w|-\w)/g, (m) => m.toUpperCase().replace(/-/g, ''));

// Format dimensions as a human-readable string (used in the mapping's "name" field).
const formatDimensions = (dims: {
  depth: number;
  width: number;
  height: number;
}) => `${dims.depth}m D × ${dims.width}m W × ${dims.height}m H`;
