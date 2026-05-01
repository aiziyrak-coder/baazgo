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

const appReplacements = [
  [/FoodTruckGo ilovasiga xush kelibsiz/g, "BaazGo uz ilovasiga xush kelibsiz"],
  [/>FoodTruckGo </g, ">BaazGo "],
  [/foodtruck\.uz/g, "baazgo.uz"],
  [/FoodTruckGo_Supportbot/g, "BaazGo_Supportbot"],
  [/FoodTrucklar ijarasi/g, "Avtomobillar ijarasi"],
  [/foodtruck_bookings/g, "baazgo_bookings"],
  [/foodtruck_user/g, "baazgo_user"],
  [/foodtruck_all_users/g, "baazgo_all_users"],
  [/FOODTRUCK20/g, "BAAZGO20"],
];

const authReplacements = [
  [/@foodtruck\.uz/g, "@baazgo.uz"],
  [/foodtruck_user/g, "baazgo_user"],
  [/foodtruck_all_users/g, "baazgo_all_users"],
];

const mockReplacements = [
  [/'FoodTruckGo'/g, "'BaazGo uz'"],
];

replaceInFile('src/App.tsx', appReplacements);
replaceInFile('src/hooks/useAuth.ts', authReplacements);
replaceInFile('src/lib/mockData.ts', mockReplacements);

console.log('Branding updated successfully');
