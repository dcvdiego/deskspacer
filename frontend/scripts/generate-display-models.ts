import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// TODO: make this generic and reuse it for every other model type
interface ProcessingResult {
  successes: string[];
  skips: string[];
  errors: Array<{ filename: string; error: string }>;
  modelEntries: ModelEntry[];
}

interface ModelEntry {
  name: string;
  props: {
    model: string;
    category: string;
    subcategory: string;
    curved: number;
    stand: boolean;
  };
  glbPath: string;
}

interface ParsedFilename {
  aspectRatio: string;
  version: number;
  curved: boolean;
  size: string;
  stand: boolean;
}

const PUBLIC_GLB_DIR = path.join(process.cwd(), 'public/glb/displays');
const SRC_MODELS_DIR = path.join(
  process.cwd(),
  'src/components/models/displays'
);
const MODEL_MAPPING_PATH = path.join(
  process.cwd(),
  'src/components/models/modelComponentsMapping.ts'
);

const componentExists = (componentName: string): boolean => {
  const possiblePaths = [
    path.join(SRC_MODELS_DIR, `${componentName}.tsx`),
    path.join(SRC_MODELS_DIR, `${componentName}.jsx`),
  ];
  return possiblePaths.some((p) => fs.existsSync(p));
};

const parseFilename = (filename: string): ParsedFilename => {
  // First remove any existing -transformed suffix
  const baseName = filename.replace(/-transformed$/, '');
  const parts = baseName.split('_');

  // Find the first part containing 'in' (allowing for decimals)
  const sizePart = parts.find((p) => p.toLowerCase().includes('in'));
  const hasStand = !baseName.includes('no_stand');

  if (!sizePart) {
    throw new Error(`Invalid filename format - missing size: ${filename}`);
  }

  // Extract numeric size value (including decimals)
  const sizeValue = sizePart.replace(/[^0-9.]/g, '');

  return {
    aspectRatio: parts.slice(0, 2).join('_'),
    version: parseInt(parts[3]) || 1,
    curved: parts.some((p) => p.toLowerCase() === 'curved'),
    size: `${sizeValue}"`,
    stand: hasStand,
  };
};

const generateComponentName = (filename: string): string => {
  const { aspectRatio, version, curved, size, stand } = parseFilename(filename);
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
};

const generateModelEntry = (
  filename: string,
  componentName: string,
  publicGlbPath: string
): ModelEntry => {
  const { aspectRatio, curved, size, stand, version } = parseFilename(filename);
  const subcategory = aspectRatio.replace(/_/g, ':');

  // New naming logic
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
};

const findGLBFiles = (dir: string): string[] => {
  const results: string[] = [];

  fs.readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      results.push(...findGLBFiles(fullPath));
    } else if (
      dirent.isFile() &&
      path.extname(fullPath) === '.glb' &&
      !dirent.name.includes('-transformed') // Ignore already transformed files
    ) {
      results.push(fullPath);
    }
  });

  return results;
};

const processFiles = (): ProcessingResult => {
  const result: ProcessingResult = {
    successes: [],
    skips: [],
    errors: [],
    modelEntries: [],
  };
  const glbFiles = findGLBFiles(PUBLIC_GLB_DIR);

  glbFiles.forEach((glbPath) => {
    try {
      const relativePath = path.relative(PUBLIC_GLB_DIR, glbPath);
      const subDir = path.dirname(relativePath);
      const filename = path.basename(glbPath, '.glb');
      const componentName = generateComponentName(filename);
      const publicGlbDir = path.dirname(glbPath);

      // Calculate public paths
      const transformedGlbName = `${filename}-transformed.glb`;
      const publicGlbDest = path.join(publicGlbDir, transformedGlbName);
      const relativePublicPath = path
        .join(
          '/glb/displays',
          path.dirname(relativePath), // Preserve subdirectory structure
          transformedGlbName
        )
        .replace(/\\/g, '/');

      if (componentExists(componentName)) {
        console.log(`⏩ Skipping processing ${filename} - component exists`);
        if (fs.existsSync(path.join(SRC_MODELS_DIR, `${componentName}.tsx`))) {
          result.modelEntries.push(
            generateModelEntry(filename, componentName, relativePublicPath)
          );
          result.successes.push(filename);
        }
        return;
      }

      const outputDir = path.join(SRC_MODELS_DIR, subDir);
      const outputFilename = `${filename}-transformed`;

      if (fs.existsSync(publicGlbDest)) {
        console.log(
          `⏩ Skipping processing ${filename} - transformed GLB exists`
        );
        if (fs.existsSync(path.join(outputDir, `${componentName}.tsx`))) {
          result.modelEntries.push(
            generateModelEntry(filename, componentName, relativePublicPath)
          );
          result.successes.push(filename);
        }
        return;
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate TSX and GLB
      execSync(
        // TODO: if this becomes part of CICD then gltfjsx should be a dev dependency using pnpm exec for faster workflows
        `pnpm dlx gltfjsx ${glbPath} -t -E -T -o ${path.join(
          outputDir,
          outputFilename
        )}.tsx`,
        { stdio: 'inherit' }
      );

      // Move GLB to public directory
      const generatedGlb = path.join(outputDir, `${outputFilename}.glb`);
      fs.renameSync(generatedGlb, publicGlbDest);

      // Rename TSX file
      const tsxPath = path.join(outputDir, `${outputFilename}.tsx`);
      const newTsxPath = path.join(outputDir, `${componentName}.tsx`);
      fs.renameSync(tsxPath, newTsxPath);

      // Update TSX content with correct GLB path
      let tsxContent = fs.readFileSync(newTsxPath, 'utf-8');
      tsxContent = tsxContent.replace(
        /useGLTF\(['"].*?['"]\)/,
        `useGLTF('${relativePublicPath}')`
      );
      fs.writeFileSync(newTsxPath, tsxContent);

      result.modelEntries.push(
        generateModelEntry(filename, componentName, relativePublicPath)
      );
      result.successes.push(filename);
      console.log(`✅ Processed ${filename} -> ${componentName}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push({ filename: path.basename(glbPath), error: errorMsg });
      console.log(`❌ Error processing ${path.basename(glbPath)}: ${errorMsg}`);
    }
  });

  return result;
};

const updateModelMapping = (newEntries: ModelEntry[]) => {
  // 1. Get existing entries from file
  const existingEntries = getExistingMappingEntries();

  // 2. Create a map to prevent duplicates (new entries take priority)
  const entryMap = new Map<string, ModelEntry>();

  // Add existing entries first
  existingEntries.forEach((entry) => entryMap.set(entry.props.model, entry));

  // Add/overwrite with new entries
  newEntries.forEach((entry) => entryMap.set(entry.props.model, entry));

  // 3. Convert map back to sorted array
  const allEntries = Array.from(entryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // 4. Generate imports as array

  const importsArray = Array.from(new Set(allEntries.map((e) => e.props.model)))
    .sort()
    .map((model) => {
      const entry = allEntries.find((e) => e.props.model === model)!;
      // Extract subdirectory from glbPath (e.g. "16_9_curved_monitors_no_stand")
      const subdirectory = entry.glbPath.split('/').slice(-2, -1)[0]; // Get second last path segment
      return `import ${model} from './displays/${subdirectory}/${model}';`;
    });

  // Generate mapping content
  const mappingContent = allEntries
    .map((entry) => {
      const props = [
        `model: ${entry.props.model}`,
        `category: '${entry.props.category}'`,
        `subcategory: '${entry.props.subcategory}'`,
        ...(entry.props.curved ? [`curved: ${entry.props.curved}`] : []),
        ...(entry.props.stand !== undefined
          ? [`stand: ${entry.props.stand}`]
          : []),
        `glbPath: '${entry.glbPath}'`,
      ].join(',\n    ');

      return `  '${entry.name}': {
    ${props}
  }`;
    })
    .join(',\n');

  // Create final file content
  const fileContent = `import { ModelComponentType } from '../../types/ModelTypes';
  
${importsArray.join('\n')}

export const modelComponents: {
  [key: string]: {
    model: ModelComponentType;
    category: string;
    subcategory: string;
    curved?: number;
    stand?: boolean;
    glbPath: string;
  };
} = {
${mappingContent}
};\n`;

  // Write to file
  fs.writeFileSync(MODEL_MAPPING_PATH, fileContent);
  console.log(
    // TODO: newEntries is not accurate
    `\n📦 Updated model mapping with ${allEntries.length} entries (${newEntries.length} new)`
  );
};

const getExistingMappingEntries = (): ModelEntry[] => {
  if (!fs.existsSync(MODEL_MAPPING_PATH)) return [];

  try {
    const content = fs.readFileSync(MODEL_MAPPING_PATH, 'utf-8');
    const entries: ModelEntry[] = [];

    const entryRegex = /['"](.*?)['"]:\s*\{\s*([\s\S]*?)\s*\}(?=,|$)/g;

    let match;
    while ((match = entryRegex.exec(content)) !== null) {
      const [, name, propsText] = match;
      try {
        const modelMatch = RegExp(/model:\s*(\w+)/).exec(propsText);
        const categoryMatch = RegExp(/category:\s*'([^']+)'/).exec(propsText);
        const subcategoryMatch = RegExp(/subcategory:\s*'([^']+)'/).exec(
          propsText
        );
        const curvedMatch = RegExp(/curved:\s*(\d+)/).exec(propsText);
        const standMatch = RegExp(/stand:\s*(true|false)/).exec(propsText);
        const glbPathMatch = /glbPath\s*:\s*['"]([^'"]+)['"]/.exec(propsText);

        if (
          !modelMatch ||
          !categoryMatch ||
          !subcategoryMatch ||
          !glbPathMatch
        ) {
          console.error(`⚠️ Missing required fields in entry '${name}'`);
          continue;
        }

        entries.push({
          name: name.replace(/\\'/g, "'"),
          props: {
            model: modelMatch[1],
            category: categoryMatch[1],
            subcategory: subcategoryMatch[1],
            curved: curvedMatch ? parseInt(curvedMatch[1]) : 0,
            stand: standMatch ? standMatch[1] === 'true' : false,
          },
          glbPath: glbPathMatch[1],
        });
      } catch (e) {
        console.error(`⚠️ Error parsing entry '${name}': ${e}`);
      }
    }

    return entries;
  } catch (error) {
    console.error('⚠️ Error reading existing mapping file:', error);
    return [];
  }
};

// Modified main execution
const run = () => {
  // only run if necessary,
  // NUKE_TRANSFORMED_GLB();
  const result = processFiles();
  updateModelMapping(result.modelEntries);

  console.log('\nProcessing Summary:');
  console.log(`✅ Successfully processed: ${result.successes.length}`);
  console.log(`⏩ Skipped files: ${result.skips.length}`);
  console.log(`❌ Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\nError Details:');
    result.errors.forEach(({ filename, error }) =>
      console.log(`  ${filename}: ${error}`)
    );
  }

  console.log(
    '\n🎉 Script completed! Existing components preserved, new components added.'
  );
};
run();
