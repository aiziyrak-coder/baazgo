const fs = require('fs');

const file = 'src/components/MyBookingsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text-black dark:text-white font-bold/g, 'text-slate-800 dark:text-slate-200');
content = content.replace(/text-black font-bold/g, 'text-slate-800 dark:text-slate-200');
content = content.replace(/text-black/g, 'text-slate-800 dark:text-slate-200');

fs.writeFileSync(file, content);
console.log('Restored semantic text colors in MyBookingsPage');
