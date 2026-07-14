#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const { spawnSync } = require('child_process');

const frontendDir = path.resolve(__dirname, '..');
const imagesDir = path.join(frontendDir, 'images');
const outputFile = path.join(frontendDir, 'src', 'sectionImages.js');

const IMAGE_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function getWebpName(index) {
  return `p${index}.webp`;
}

function getTargetName(index, ext) {
  if (ext === '.jpg' || ext === '.jpeg') {
    return getWebpName(index);
  }
  return `p${index}${ext}`;
}

function convertToWebp(sourcePath, destPath) {
  const result = spawnSync('cwebp', ['-q', '80', sourcePath, '-o', destPath], {
    encoding: 'utf8'
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`cwebp failed for ${sourcePath}: ${result.stderr || result.stdout}`);
  }
}

async function prepareImages() {
  const entries = await fs.readdir(imagesDir, { withFileTypes: true });
  const sectionDirs = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const sectionImages = {};

  for (const section of sectionDirs) {
    const sectionPath = path.join(imagesDir, section);
    const files = await fs.readdir(sectionPath, { withFileTypes: true });
    const imageFiles = files
      .filter(file => file.isFile())
      .map(file => file.name)
      .filter(name => name.toLowerCase() !== 'index.json')
      .filter(name => isImageFile(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const sectionList = [];

    for (let index = 0; index < imageFiles.length; index += 1) {
      const originalName = imageFiles[index];
      const originalPath = path.join(sectionPath, originalName);
      const ext = path.extname(originalName).toLowerCase();
      const targetName = getTargetName(index, ext);
      const targetPath = path.join(sectionPath, targetName);

      if (ext === '.jpg' || ext === '.jpeg') {
        convertToWebp(originalPath, targetPath);
        await fs.rm(originalPath);
      } else if (originalName !== targetName) {
        await fs.rename(originalPath, targetPath);
      }

      sectionList.push(targetName);
    }

    sectionImages[section] = sectionList;
  }

  const fileContent = `const sectionImages = ${JSON.stringify(sectionImages, null, 2)};\nexport default sectionImages;\n`;
  await fs.writeFile(outputFile, fileContent, 'utf8');
  console.log(`Generated ${outputFile}`);
}

prepareImages().catch(error => {
  console.error(error);
  process.exit(1);
});
