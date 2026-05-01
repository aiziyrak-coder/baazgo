const fs = require('fs');
const files = ['src/App.tsx', 'src/components/MyBookingsPage.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/text-white(?!(\/|\w))/g, 'text-black font-bold');

  fs.writeFileSync(file, content);
});
console.log('Got rid of remaining plain text-white');
