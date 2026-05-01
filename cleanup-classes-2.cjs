const fs = require('fs');
const files = ['src/App.tsx', 'src/components/MyBookingsPage.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/dark:text-black dark:text-white font-bold/g, 'dark:text-white font-bold');
  content = content.replace(/text-black font-bold font-bold/g, 'text-black font-bold');
  content = content.replace(/text-black\s+font-bold\s+dark:text-white/g, 'text-black dark:text-white font-bold');
  content = content.replace(/dark:text-white\s+font-bold\s+font-bold/g, 'dark:text-white font-bold');
  content = content.replace(/text-black\s+dark:text-white\s+font-bold\s+font-bold/g, 'text-black dark:text-white font-bold');

  fs.writeFileSync(file, content);
});
console.log('Cleaned up duplicated text classes');
