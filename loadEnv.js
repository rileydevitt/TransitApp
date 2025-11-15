// Shared helper to hydrate process.env from a .env file.

const fs = require('fs');
const path = require('path');

/**
 * Loads key/value pairs from the provided .env file into process.env.
 * Existing environment variables are not overwritten.
 */
function loadEnvFromFile(customPath) {
  const envPath = customPath || path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');
  contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .forEach((line) => {
      if (!line || line.startsWith('#')) {
        return;
      }
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    });
}

module.exports = loadEnvFromFile;
