// toolRegistry.js
// Automatically loads all tool files from the tools/ folder

const fs = require('fs');
const path = require('path');

function loadTools() {
  const toolsDir = path.join(__dirname, 'tools');
  if (!fs.existsSync(toolsDir)) {
    console.warn('No tools directory found.');
    return { definitions: [], executors: {} };
  }

  const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.js'));
  const definitions = [];
  const executors = {};

  for (const file of toolFiles) {
    try {
      const tool = require(path.join(toolsDir, file));
      if (!tool.definition || !tool.execute) {
        console.warn(`⚠️  Tool file "${file}" missing definition or execute. Skipping.`);
        continue;
      }
      definitions.push(tool.definition);
      executors[tool.definition.function.name] = tool.execute;
    } catch (err) {
      console.error(`❌ Error loading tool "${file}":`, err);
    }
  }

  console.log(`🔧 Loaded ${definitions.length} tool(s).`);
  return { definitions, executors };
}

module.exports = { loadTools };