const fs = require('node:fs/promises');
const path = require('node:path');

const dataPath = path.join(__dirname, '../../data/workbench.json');

async function readStore() {
  const content = await fs.readFile(dataPath, 'utf8');
  return JSON.parse(content);
}

async function writeStore(data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(dataPath, content, 'utf8');
  return data;
}

async function updateStore(mutator) {
  const data = await readStore();
  const nextData = await mutator(data);
  return writeStore(nextData ?? data);
}

module.exports = {
  readStore,
  updateStore,
  writeStore,
};
