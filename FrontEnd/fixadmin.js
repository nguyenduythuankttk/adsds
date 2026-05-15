const fs = require('fs');
const path = 'd:/matlab2025/weeb/asset/js/admin.js';
let content = fs.readFileSync(path, 'utf8');
// Fix escaped backticks and template literal dollar signs
content = content.replace(/\\`/g, '`').replace(/\\\${/g, '${');
fs.writeFileSync(path, content, 'utf8');
console.log('Done! Fixed', (content.match(/`/g)||[]).length, 'backticks');
