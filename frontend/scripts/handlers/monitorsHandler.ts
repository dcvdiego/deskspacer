import path from 'path';
import { ModelHandler } from '../modelProcessing';

export const monitorsHandler: ModelHandler = {
  category: 'displays',
  publicGlbDir: path.join(process.cwd(), 'public/glb/displays'),
  srcModelsDir: path.join(process.cwd(), 'src/components/models/displays'),

  parseFilename: (filename: string) => {
    const baseName = filename.replace(/-transformed$/, '');
    const parts = baseName.split('_');
    const sizePart = parts.find((p) => p.toLowerCase().includes('in'));
    const hasStand = !baseName.includes('no_stand');

    if (!sizePart) {
      throw new Error(`Invalid filename format - missing size: ${filename}`);
    }

    const sizeValue = sizePart.replace(/[^0-9.]/g, '');

    return {
      aspectRatio: parts.slice(0, 2).join('_'),
      version: parseInt(parts[3]) || 1,
      curved: parts.some((p) => p.toLowerCase() === 'curved'),
      size: `${sizeValue}"`,
      stand: hasStand,
    };
  },

  generateComponentName: (parsedData) => {
    const { aspectRatio, version, curved, size, stand } = parsedData;
    const aspect = aspectRatio.replace(/_/g, '');
    const cleanSize = size
      .replace('"', '')
      .replace('.', 'dot')
      .replace(/\W/g, '');
    return [
      'Monitor',
      aspect,
      version > 1 ? `${version}` : '',
      cleanSize,
      curved ? 'Curved' : '',
      stand ? 'Stand' : '',
    ]
      .filter(Boolean)
      .join('');
  },

  generateModelEntry: (componentName, publicGlbPath, parsedData) => {
    const { aspectRatio, curved, size, stand, version } = parsedData;
    const subcategory = aspectRatio.replace(/_/g, ':');
    const baseName = `${subcategory} ${size}${curved ? ' Curved' : ''} Monitor`;
    const versionString = version > 1 ? ` v${version}` : '';
    const standString = stand ? ' with Stand' : '';

    return {
      name: `${baseName}${versionString}${standString}`,
      props: {
        model: componentName,
        category: 'displays',
        subcategory,
        curved: curved ? 1000 : 0,
        stand,
      },
      glbPath: publicGlbPath,
    };
  },
};
