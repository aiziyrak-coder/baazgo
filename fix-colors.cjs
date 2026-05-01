const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text-black dark:text-white font-bold/g, 'text-slate-800 dark:text-slate-200');
content = content.replace(/text-black font-bold/g, 'text-slate-800 dark:text-slate-200');
content = content.replace(/text-black/g, 'text-slate-800 dark:text-slate-200');
// Some buttons might have white text
content = content.replace(/bg-\[\#FF9500\] text-slate-800 dark:text-slate-200/g, 'bg-[#FF9500] text-white');
content = content.replace(/bg-blue-600 text-slate-800 dark:text-slate-200/g, 'bg-blue-600 text-white');

fs.writeFileSync(file, content);
console.log('Restored semantic text colors');
