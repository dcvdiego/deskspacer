import { NUKE_TRANSFORMED_GLB } from '../src/utils/utils';
import { desksHandler } from './handlers/desksHandler';
import { keyboardsHandler } from './handlers/keyboardsHandler';
import { monitorsHandler } from './handlers/monitorsHandler';
import {
  processModelFiles,
  updateModelMapping,
  ProcessingResult,
} from './modelProcessing';
import path from 'path';

const MODEL_MAPPING_PATH = path.join(
  process.cwd(),
  'src/components/models/modelComponentsMapping.ts'
);
const modelHandlers = [monitorsHandler, desksHandler, keyboardsHandler];
const arg = process.argv[2];
const selectedHandlers =
  arg && arg !== 'all'
    ? modelHandlers.filter((handler) => handler.category === arg)
    : modelHandlers;

if (selectedHandlers.length === 0) {
  console.error(`❌ No matching handlers found for: ${arg}`);
  process.exit(1);
}
const run = () => {
  const allResults: ProcessingResult[] = [];
  NUKE_TRANSFORMED_GLB();
  modelHandlers.forEach((handler) => {
    console.log(`\n🔨 Processing ${handler.category}...`);
    const result = processModelFiles(handler);
    allResults.push(result);
  });

  const combinedEntries = allResults.flatMap((r) => r.modelEntries);
  updateModelMapping(combinedEntries, MODEL_MAPPING_PATH);

  console.log('\nProcessing Summary:');
  allResults.forEach((result, index) => {
    console.log(`\n${modelHandlers[index].category.toUpperCase()}:`);
    console.log(`✅ Successfully processed: ${result.successes.length}`);
    console.log(`⏩ Skipped files: ${result.skips.length}`);
    console.log(`❌ Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nError Details:');
      result.errors.forEach(({ filename, error }) =>
        console.log(`  ${filename}: ${error}`)
      );
    }
  });

  console.log(
    '\n🎉 Script completed! Existing components preserved, new components added.'
  );
};

run();
