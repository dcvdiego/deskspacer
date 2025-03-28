import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface ProcessingResult {
  successes: string[];
  skips: string[];
  errors: Array<{ filename: string; error: string }>;
  modelEntries: ModelEntry[];
}

export interface ModelEntry {
  name: string;
  props: {
    model: string;
    category: string;
    subcategory: string;
    [key: string]: any; // Allow custom attributes
  };
  glbPath: string;
}

export interface ModelHandler {
  category: string;
  publicGlbDir: string;
  srcModelsDir: string;
  parseFilename: (filename: string) => any;
  generateComponentName: (parsedData: any) => string;
  generateModelEntry: (
    componentName: string,
    publicGlbPath: string,
    parsedData: any
  ) => ModelEntry;
}

export const componentExists = (
  srcModelsDir: string,
  componentName: string
): boolean => {
  const possiblePaths = [
    path.join(srcModelsDir, `${componentName}.tsx`),
    path.join(srcModelsDir, `${componentName}.jsx`),
  ];
  return possiblePaths.some((p) => fs.existsSync(p));
};

export const findGLBFiles = (dir: string): string[] => {
  const results: string[] = [];

  fs.readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      results.push(...findGLBFiles(fullPath));
    } else if (
      dirent.isFile() &&
      path.extname(fullPath) === '.glb' &&
      !dirent.name.includes('-transformed')
    ) {
      results.push(fullPath);
    }
  });

  return results;
};

export const processModelFiles = (handler: ModelHandler): ProcessingResult => {
  const result: ProcessingResult = {
    successes: [],
    skips: [],
    errors: [],
    modelEntries: [],
  };

  const glbFiles = findGLBFiles(handler.publicGlbDir);

  glbFiles.forEach((glbPath) => {
    try {
      const relativePath = path.relative(handler.publicGlbDir, glbPath);
      const subDir = path.dirname(relativePath);
      const filename = path.basename(glbPath, '.glb');
      const parsedData = handler.parseFilename(filename);
      const componentName = handler.generateComponentName(parsedData);
      const publicGlbDir = path.dirname(glbPath);

      const transformedGlbName = `${filename}-transformed.glb`;
      const publicGlbDest = path.join(publicGlbDir, transformedGlbName);
      const relativePublicPath = path
        .join(
          `/glb/${handler.category}`,
          path.dirname(relativePath),
          transformedGlbName
        )
        .replace(/\\/g, '/');

      if (componentExists(handler.srcModelsDir, componentName)) {
        console.log(`⏩ Skipping processing ${filename} - component exists`);
        if (
          fs.existsSync(path.join(handler.srcModelsDir, `${componentName}.tsx`))
        ) {
          result.modelEntries.push(
            handler.generateModelEntry(
              componentName,
              relativePublicPath,
              parsedData
            )
          );
          result.successes.push(filename);
        }
        return;
      }

      const outputDir = path.join(handler.srcModelsDir, subDir);
      const outputFilename = `${filename}-transformed`;

      if (fs.existsSync(publicGlbDest)) {
        console.log(
          `⏩ Skipping processing ${filename} - transformed GLB exists`
        );
        if (fs.existsSync(path.join(outputDir, `${componentName}.tsx`))) {
          result.modelEntries.push(
            handler.generateModelEntry(
              componentName,
              relativePublicPath,
              parsedData
            )
          );
          result.successes.push(filename);
        }
        return;
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      execSync(
        `pnpm dlx gltfjsx ${glbPath} -t -E -T -o ${path.join(
          outputDir,
          outputFilename
        )}.tsx`,
        { stdio: 'inherit' }
      );

      const generatedGlb = path.join(outputDir, `${outputFilename}.glb`);
      fs.renameSync(generatedGlb, publicGlbDest);

      const tsxPath = path.join(outputDir, `${outputFilename}.tsx`);
      const newTsxPath = path.join(outputDir, `${componentName}.tsx`);
      fs.renameSync(tsxPath, newTsxPath);

      let tsxContent = fs.readFileSync(newTsxPath, 'utf-8');
      tsxContent = tsxContent.replace(
        /useGLTF\(['"].*?['"]\)/,
        `useGLTF('${relativePublicPath}')`
      );
      fs.writeFileSync(newTsxPath, tsxContent);

      result.modelEntries.push(
        handler.generateModelEntry(
          componentName,
          relativePublicPath,
          parsedData
        )
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

export const updateModelMapping = (
  newEntries: ModelEntry[],
  MODEL_MAPPING_PATH: string
) => {
  const existingEntries = getExistingMappingEntries(MODEL_MAPPING_PATH);

  const entryMap = new Map<string, ModelEntry>();
  existingEntries.forEach((entry) => entryMap.set(entry.props.model, entry));
  newEntries.forEach((entry) => entryMap.set(entry.props.model, entry));

  const allEntries = Array.from(entryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const importsArray = Array.from(new Set(allEntries.map((e) => e.props.model)))
    .sort()
    .map((model) => {
      const entry = allEntries.find((e) => e.props.model === model)!;
      const subdirectory = entry.glbPath.split('/').slice(-2, -1)[0];
      return `import ${model} from './${entry.props.category}/${subdirectory}/${model}';`;
    });

  const mappingContent = allEntries
    .map((entry) => {
      const props = [
        `model: ${entry.props.model}`,
        `category: '${entry.props.category}'`,
        `subcategory: '${entry.props.subcategory}'`,
        ...Object.entries(entry.props)
          .filter(
            ([key]) => !['model', 'category', 'subcategory'].includes(key)
          )
          .map(([key, value]) => {
            if (typeof value === 'string') return `${key}: '${value}'`;
            if (typeof value === 'boolean' || typeof value === 'number')
              return `${key}: ${value}`;
            return `${key}: ${value}`;
          }),
        `glbPath: '${entry.glbPath}'`,
      ].join(',\n    ');

      return `  '${entry.name}': {
    ${props}
  }`;
    })
    .join(',\n');

  const fileContent = `import { ModelComponentType } from '../../types/ModelTypes';
  
${importsArray.join('\n')}

export const modelComponents: {
  [key: string]: {
    model: ModelComponentType;
    category: string;
    subcategory: string;
    [key: string]: any;
    glbPath: string;
  };
} = {
${mappingContent}
};\n`;

  fs.writeFileSync(MODEL_MAPPING_PATH, fileContent);
  console.log(
    `\n📦 Updated model mapping with ${allEntries.length} entries (${newEntries.length} new)`
  );
};

const getExistingMappingEntries = (
  MODEL_MAPPING_PATH: string
): ModelEntry[] => {
  if (!fs.existsSync(MODEL_MAPPING_PATH)) return [];

  try {
    const content = fs.readFileSync(MODEL_MAPPING_PATH, 'utf-8');
    const entries: ModelEntry[] = [];
    const entryRegex = /['"](.*?)['"]:\s*\{\s*([\s\S]*?)\s*\}(?=,|$)/g;

    let match;
    while ((match = entryRegex.exec(content)) !== null) {
      const [, name, propsText] = match;
      try {
        const props: Record<string, any> = {};
        const propMatches = propsText.matchAll(/(\w+):\s*(.*?)(?=,|\n|$)/g);

        for (const pm of propMatches) {
          const key = pm[1];
          const value = pm[2].trim().replace(/['"]/g, '');
          if (value === 'true') props[key] = true;
          else if (value === 'false') props[key] = false;
          else if (!isNaN(Number(value))) props[key] = Number(value);
          else props[key] = value;
        }

        entries.push({
          name: name.replace(/\\'/g, "'"),
          props: {
            model: props.model,
            category: props.category,
            subcategory: props.subcategory,
            ...props,
          },
          glbPath: props.glbPath,
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
