const fs = require('fs');

const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/rgba\(255, 149, 0, 0\.4\)/g, 'rgba(15, 23, 42, 0.2)');
content = content.replace(/rgba\(255, 149, 0, 0\.9\)/g, 'rgba(15, 23, 42, 0.9)');
content = content.replace(/#FF9500/g, '#0f172a');
content = content.replace(/#FF007A/g, '#334155');

fs.writeFileSync(file, content);
console.log('Updated index.css cluster colors and scrollbars');
