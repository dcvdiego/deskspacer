import { describe, expect, it } from 'vitest';
import * as generatedComponents from './modelComponentsMapping';

import { GLTFStructureLoader } from 'gltfjsx';
import fs from 'fs/promises';

describe('Generated Components', () => {
  it('should have modelComponents exported', () => {
    expect(generatedComponents.modelComponents).toBeDefined();
    expect(typeof generatedComponents.modelComponents).toBe('object');
  });

  // TODO: Once GLTFJSX undergoes massive PR change I can implement this: https://github.com/rosskevin/gltfjsx/blob/main/test/load/loadGLTF.test.ts
  //   Object.entries(generatedComponents.modelComponents).forEach(
  //     ([name, config]) => {
  //       it(`renders ${name} without errors`, async () => {
  //         const loader = new GLTFStructureLoader();
  //         const data = await fs.readFile(config.glbPath);
  //         const { scene } = await new Promise((res) =>
  //           loader.parse(data, '', res)
  //         );
  //         expect(scene.instance.getObjectByName(name)).toBeTruthy();
  //         // const Component = config.model;
  //         // const renderer = await ReactThreeTestRenderer.create(
  //         //   <Component name={name} />
  //         // );
  //         // expect(renderer.scene.instance.getObjectByName(name)).toBeTruthy();
  //       });
  //     }
  //   );
});
