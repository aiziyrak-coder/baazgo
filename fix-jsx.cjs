const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/>BaazGo span/g, '>BaazGo <span');
content = content.replace(/>BaazGo uz span/g, '>BaazGo uz <span');

fs.writeFileSync(file, content);
console.log('Fixed JSX syntax error');
