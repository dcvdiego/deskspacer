import path from 'path';
import fs from 'fs';
import * as THREE from 'three';
export const positionsAreEqual = (pos1: THREE.Vector3, pos2: THREE.Vector3) =>
  pos1
    .toArray()
    .map((_: number) => _.toFixed(2))
    .toString() ===
  pos2
    .toArray()
    .map((_: number) => _.toFixed(2))
    .toString();

export const quaternionsAreEqual = (
  q1: THREE.Quaternion,
  q2: THREE.Quaternion
) => q1.toArray().toString() === q2.toArray().toString();
export const NUKE_TRANSFORMED_GLB = () => {
  const directory = path.join(process.cwd(), 'public/glb/desks');
  let deletedCount = 0;

  const deleteTransformedFiles = (dir: string) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
      const fullPath = path.join(dir, dirent.name);

      if (dirent.isDirectory()) {
        deleteTransformedFiles(fullPath); // Recurse into subdirectories
      } else if (
        dirent.isFile() &&
        (/-transformed\.glb$/i.test(dirent.name) ||
          /-transformed\.tsx$/i.test(dirent.name))
      ) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️  Deleted: ${path.relative(directory, fullPath)}`);
        deletedCount++;
      }
    });
  };

  deleteTransformedFiles(directory);
  console.log(
    `\n♻️  Cleanup complete! Removed ${deletedCount} transformed GLB and TSX files`
  );
};
