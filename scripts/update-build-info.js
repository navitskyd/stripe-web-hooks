const { execSync } = require('child_process');
const fs = require('fs');

let commit = 'unknown';
let comment = '';

try {
  commit = execSync('git rev-parse HEAD').toString().trim();
  comment = execSync('git log -1 --pretty=%B').toString().trim();
} catch (e) {
  comment = 'Could not retrieve git info';
}

fs.writeFileSync(
  'build-info.json',
  JSON.stringify({ commit, comment }, null, 2)
);
console.log('build-info.json updated:', { commit, comment });
