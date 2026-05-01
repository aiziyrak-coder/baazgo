const fs = require('fs');

const files = ['src/App.tsx', 'src/components/MyBookingsPage.tsx', 'src/components/AdminDashboard.tsx'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove all dark: classes
  content = content.replace(/dark:[^\s"']+/g, '');
  
  // Convert all slate text colors to text-slate-900 for high contrast
  content = content.replace(/text-slate-[1-8]00/g, 'text-slate-900');
  content = content.replace(/text-slate-50/g, 'text-slate-900');
  
  // Replace white text with slate-900
  content = content.replace(/text-white(?!\/)/g, 'text-slate-900');
  content = content.replace(/text-white\/[0-9]+/g, 'text-slate-900');
  
  // Change button backgrounds from yellow/orange to maybe a high-contrast nice color so dark text works.
  // Actually, yellow + dark text is fine. The user said "sariq kerak emas" implies no yellow text.
  content = content.replace(/text-yellow-[0-9]+/g, 'text-slate-900');
  
  // Replace text-slate-900 with slate-900 (just to be uniform)
  // Let's also ensure 'font-medium' or something if we want.

  fs.writeFileSync(file, content);
});

console.log('Stripped dark mode and set text to slate-900');
