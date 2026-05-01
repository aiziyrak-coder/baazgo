const fs = require('fs');
const files = ['src/App.tsx', 'src/components/MyBookingsPage.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-slate-400/g, 'text-slate-600 dark:text-slate-400');
  content = content.replace(/text-slate-500/g, 'text-slate-700 dark:text-slate-300');
  // text-white/80 on dark cards
  content = content.replace(/text-white\/70/g, 'text-white/90');
  content = content.replace(/text-white\/80/g, 'text-white/90');
  // yellow colors that might be hard to read
  content = content.replace(/text-yellow-500/g, 'text-[#FF9500]');
  
  fs.writeFileSync(file, content);
});
console.log('Replaced colors successfully');
