import path from 'path';
import { ModelHandler } from '../modelProcessing';
interface DeskPositionConfig {
  position: [number, number, number];
  rotation: number;
}
const deskPositionMap: Record<string, DeskPositionConfig> = {
  regularDesk: { position: [0, 29, -47], rotation: Math.PI / 2 },
  modernDesk: { position: [0, 30.7, -53], rotation: Math.PI / 2 },
  drawerDesk: { position: [0, 1, -38], rotation: Math.PI },
  standingDesk: { position: [-28, 30, -45], rotation: Math.PI / 2 },
  malmDesk: { position: [0, 51, -53], rotation: Math.PI / 2 },
  outputPlatformDesk: { position: [0, 30.5, -59], rotation: -Math.PI / 2 },
  linnmonDesk: { position: [0, 29.5, -55], rotation: Math.PI / 2 }, // Base for 39/47/59
  alexDesk: { position: [0, 29, -50], rotation: Math.PI / 2 + Math.PI }, // Base for 61/67/79
  bekantLShapedLeft: {
    position: [0, 31, -55],
    rotation: Math.PI / 2 + Math.PI,
  },
  bekantLShapedRight: {
    position: [0, 31, -55],
    rotation: Math.PI / 2 + Math.PI,
  },
  customDesk: { position: [0, 30.2, -53], rotation: 0 },
};
const getPositionKey = (parsedData: {
  family: any;
  type: any;
  orientation: any;
  size: any;
}): string => {
  const { family, type, orientation, size } = parsedData;

  // Handle special cases
  if (family === 'alex') return 'alexDesk';
  if (family === 'linnmon') return 'linnmonDesk';
  if (family === 'bekant') return `bekantLShaped${pascalCase(orientation)}`;
  if (family === 'malm') return 'malmDesk';
  if (family === 'output') return 'outputPlatformDesk';
  if (family === 'regular') return 'regularDesk';
  if (family === 'standing') return 'standingDesk';
  // Size-specific desks
  if (size) {
    if (family === 'alex' && [61, 67, 79].includes(size)) return 'alexDesk';
    if (family === 'linnmon' && [39, 47, 59].includes(size))
      return 'linnmonDesk';
  }

  return type === 'L_shaped' ? `bekantLShaped${pascalCase(orientation)}` : type;
};
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
    const isAlex = parts.some((p) => p.toLowerCase().startsWith('alex'));
    const isLinnmon = parts.some((p) => p.toLowerCase().startsWith('linnmon'));
    const isBekant = parts.some((p) => p.toLowerCase().startsWith('bekant'));
    const isMalm = parts.some((p) => p.toLowerCase().startsWith('malm'));
    const isOutputPlatform = parts.some((p) =>
      p.toLowerCase().startsWith('output')
    );
    const isRegular = parts.some((p) => p.toLowerCase().startsWith('regular'));
    const isStanding = parts.some((p) =>
      p.toLowerCase().startsWith('standing')
    );
    return {
      type: parts[0], // e.g., "standing", "L_shaped", "regular"
      family: isAlex
        ? 'alex'
        : isLinnmon
          ? 'linnmon'
          : isBekant
            ? 'bekant'
            : isMalm
              ? 'malm'
              : isOutputPlatform
                ? 'output'
                : isRegular
                  ? 'regular'
                  : isStanding
                    ? 'standing'
                    : 'standard',
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

  generateModelEntry: (componentName, publicGlbPath, parsedData) => {
    const getPosition = (parsedData: any): [number, number, number] => {
      const key = getPositionKey(parsedData);
      return deskPositionMap[key]?.position || [0, 0, 0];
    };

    const getRotationY = (parsedData: any): number => {
      const key = getPositionKey(parsedData);
      return deskPositionMap[key]?.rotation || 0;
    };
    return {
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
        initPosition: getPosition(parsedData),
        initRotationY: getRotationY(parsedData),
        // Keep dimensions as an object (with numbers) in the props.
        ...(parsedData.dimensions && { dimensions: parsedData.dimensions }),
        material: parsedData.material,
        version: parsedData.version,
        orientation: parsedData.orientation,
      },
      glbPath: publicGlbPath,
    };
  },
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
