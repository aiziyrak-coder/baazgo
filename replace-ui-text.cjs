const fs = require('fs');

const replaceInFile = (file, replacements) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    replacements.forEach(([search, replace]) => {
      content = content.replace(search, replace);
    });
    fs.writeFileSync(file, content);
  }
};

replaceInFile('src/components/MyBookingsPage.tsx', [
  [/foodtruck bron qilmadingiz/g, "avtomobil bron qilmadingiz"],
  [/FoodTruck izlash/g, "Avtomobil izlash"]
]);

console.log('UI texts updated');
