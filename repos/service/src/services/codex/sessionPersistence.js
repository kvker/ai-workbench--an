const fs = require('node:fs/promises');
const path = require('node:path');

const dataPath = path.join(__dirname, '../../../data/codex-sessions.json');

async function readPersistedSessions() {
  try {
    const content = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(content);

    return Array.isArray(data.sessions) ? data.sessions : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function writePersistedSessions(sessions) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, `${JSON.stringify({ sessions }, null, 2)}\n`, 'utf8');
}

module.exports = {
  readPersistedSessions,
  writePersistedSessions,
};
