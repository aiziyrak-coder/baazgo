const fs = require('fs');
const files = ['src/App.tsx', 'src/components/MyBookingsPage.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the specific text-slate-* combinations we introduced previously
  content = content.replace(/text-slate-600 dark:text-slate-400/g, 'text-black dark:text-white font-bold');
  content = content.replace(/text-slate-700 dark:text-slate-300/g, 'text-black dark:text-white font-bold');
  
  // Replace general slate colors to be dark
  content = content.replace(/text-slate-300/g, 'text-black font-bold');
  content = content.replace(/text-slate-400/g, 'text-black font-bold');
  content = content.replace(/text-slate-500/g, 'text-black font-bold');
  content = content.replace(/text-slate-600/g, 'text-black font-bold');
  content = content.replace(/text-slate-700/g, 'text-black font-bold');
  content = content.replace(/text-slate-800/g, 'text-black font-bold');
  content = content.replace(/text-slate-900/g, 'text-black font-bold');
  
  // Replace white text since background is light glass
  content = content.replace(/text-white\/90/g, 'text-black dark:text-white font-bold');
  content = content.replace(/text-white\/80/g, 'text-black dark:text-white font-bold');
  content = content.replace(/text-white\/70/g, 'text-black dark:text-white font-bold');
  content = content.replace(/text-white\/60/g, 'text-black dark:text-white font-bold');
  content = content.replace(/text-white\/50/g, 'text-black dark:text-white font-bold');

  fs.writeFileSync(file, content);
});
console.log('Replaced colors successfully');
