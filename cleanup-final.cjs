const fs = require('fs');
const files = ['src/App.tsx', 'src/components/MyBookingsPage.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/dark:text-black font-bold/g, ''); // not sure if needed but just in case
  content = content.replace(/text-black font-bold font-bold/g, 'text-black font-bold');
  content = content.replace(/text-black\s+font-bold\s+font-bold/g, 'text-black font-bold');
  
  fs.writeFileSync(file, content);
});
console.log('Final cleanup');
