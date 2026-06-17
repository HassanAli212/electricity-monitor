const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appDir = path.join(root, 'app');
const exampleDir = path.join(root, 'app-example');

if (fs.existsSync(exampleDir)) {
  fs.rmSync(exampleDir, { recursive: true });
}

fs.renameSync(appDir, exampleDir);
fs.mkdirSync(appDir);

console.log('✅ Done! app/ is now clean. app-example/ has the old files.');
