const fs = require('fs');
const files = ['src/App.tsx', 'src/components/MyBookingsPage.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/font-medium\s+text-black\s+font-bold/g, 'text-black font-bold');
  content = content.replace(/font-semibold\s+text-black\s+font-bold/g, 'text-black font-bold');
  content = content.replace(/text-black\s+font-bold\s+font-medium/g, 'text-black font-bold');
  content = content.replace(/text-black\s+font-bold\s+font-semibold/g, 'text-black font-bold');
  content = content.replace(/text-black\s+dark:text-white\s+font-bold\s+font-medium/g, 'text-black dark:text-white font-bold');
  content = content.replace(/text-black\s+dark:text-white\s+font-bold\s+font-semibold/g, 'text-black dark:text-white font-bold');
  content = content.replace(/text-white\s+text-black\s+font-bold/g, 'text-black font-bold'); // For any text-white that wasn't /90 etc

  // Remove `text-[#FF9500]` for text and replace with `text-black`
  content = content.replace(/text-\[\#FF9500\]/g, 'text-black font-bold inline-block drop-shadow-md'); 

  fs.writeFileSync(file, content);
});
console.log('Cleaned up duplicated classes');
