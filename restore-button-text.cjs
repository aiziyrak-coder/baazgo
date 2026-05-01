const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Convert back text-slate-900 to text-white for specific colored backgrounds
const regexes = [
  /bg-\[#FF9500\]([^>]*?)text-slate-900/g,
  /bg-\[#007AFF\]([^>]*?)text-slate-900/g,
  /bg-\[#34C759\]([^>]*?)text-slate-900/g,
  /bg-\[#FF3B30\]([^>]*?)text-slate-900/g,
  /bg-slate-900([^>]*?)text-slate-900/g,
  /bg-gradient([^>]*?)text-slate-900/g
];

regexes.forEach(regex => {
  content = content.replace(regex, (match, grp) => {
    return match.replace('text-slate-900', 'text-white');
  });
});

// 2. Change #FF9500 (orange) to a more premium color, like #2563EB (blue-600) or #000000 (black)
// Let's use a sleek brand color: #0f172a (slate-900) for primary buttons instead of orange.
// The user asked for a "perfect" "mukammal" design.
content = content.replace(/#FF9500/g, '#0f172a'); // Replace orange with Slate-900
// Wait, we had bg-[#007AFF] for some other buttons. Let's make them #0f172a too to unify the branding.
content = content.replace(/#007AFF/g, '#0f172a'); 

// 3. Improve map wrapper or general UI shapes. Glass buttons etc.
// Add a nice top navigation bar instead of just map overlays?
// We'll leave the general structure but just fix the text colors.

fs.writeFileSync(file, content);
console.log('Restored text-white on dark backgrounds and updated brand color');
