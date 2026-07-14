// commandRegistry.js
// Purpose: Automatically imports all command files from the commands/ folder.

const fs = require('fs');
const path = require('path');

function loadCommands() {
  const commandsDir = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

  const commandMap = new Map();
  const descriptions = [];

  for (const file of commandFiles) {
    try {
      const commandModule = require(path.join(commandsDir, file));
      const { name, description, execute } = commandModule;
      if (!name || !description || typeof execute !== 'function') {
        console.warn(`⚠️  Command file "${file}" missing required exports. Skipping.`);
        continue;
      }
      if (commandMap.has(name)) {
        console.warn(`⚠️  Duplicate command name "${name}" in file "${file}". Overwriting.`);
      }
      commandMap.set(name, { description, execute });
      descriptions.push(`/${name} - ${description}`);
    } catch (err) {
      console.error(`❌ Error loading command file "${file}":`, err);
    }
  }

  console.log(`✅ Loaded ${commandMap.size} commands.`);
  return { commands: commandMap, descriptions };
}

// Add this function inside your CommandRegistry class or module

function getCommandsList() {
    // Assuming you have a collection/Map of loaded commands
    // Adjust based on your actual structure
    const commands = [];
    for (const [name, cmd] of this.commands.entries()) { // or whatever you named your map
        commands.push({
            name: name, // e.g., '/start'
            description: cmd.description || 'No description'
        });
    }
    return commands;
}

module.exports = { getCommandsList, /* your other exports */ };
module.exports = { loadCommands };