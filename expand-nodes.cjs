const fs = require('fs');

const extendedCities = `[
  // Toshkent viloyati va shahar
  { name: "Toshkent shahri", lat: 41.2995, lng: 69.2401, spread: 0.15, countFactor: 40 },
  { name: "Chirchiq", lat: 41.4688, lng: 69.5822, spread: 0.05, countFactor: 5 },
  { name: "Angren", lat: 41.0163, lng: 70.1436, spread: 0.05, countFactor: 5 },
  { name: "Bekobod", lat: 40.2181, lng: 69.2612, spread: 0.04, countFactor: 4 },
  { name: "Olmaliq", lat: 40.8497, lng: 69.5975, spread: 0.04, countFactor: 5 },
  { name: "Nurafshon", lat: 41.0422, lng: 69.3564, spread: 0.04, countFactor: 3 },
  { name: "Yangiyo'l", lat: 41.1114, lng: 69.0522, spread: 0.04, countFactor: 4 },
  { name: "Piskent", lat: 40.8953, lng: 69.3556, spread: 0.03, countFactor: 2 },
  { name: "Qibray", lat: 41.3853, lng: 69.4566, spread: 0.04, countFactor: 3 },
  { name: "Zangiota", lat: 41.2000, lng: 69.1500, spread: 0.05, countFactor: 3 },
  { name: "Bo'stonliq", lat: 41.5833, lng: 69.9667, spread: 0.1, countFactor: 4 },
  
  // Samarqand
  { name: "Samarqand shahri", lat: 39.6270, lng: 66.9749, spread: 0.1, countFactor: 20 },
  { name: "Urgut", lat: 39.4000, lng: 67.2403, spread: 0.04, countFactor: 4 },
  { name: "Kattaqo'rg'on", lat: 39.8972, lng: 66.2575, spread: 0.04, countFactor: 4 },
  { name: "Tayloq", lat: 39.5667, lng: 67.1167, spread: 0.04, countFactor: 3 },
  { name: "Bulung'ur", lat: 39.7578, lng: 67.2606, spread: 0.03, countFactor: 2 },
  { name: "Jomboy", lat: 39.6975, lng: 67.0864, spread: 0.03, countFactor: 2 },
  { name: "Oqdaryo", lat: 39.8833, lng: 66.8667, spread: 0.03, countFactor: 2 },
  { name: "Ishtixon", lat: 39.9572, lng: 66.4839, spread: 0.04, countFactor: 2 },
  { name: "Qo'shrabot", lat: 40.2333, lng: 66.8000, spread: 0.05, countFactor: 2 },

  // Buxoro
  { name: "Buxoro shahri", lat: 39.7681, lng: 64.4210, spread: 0.08, countFactor: 15 },
  { name: "G'ijduvon", lat: 40.1008, lng: 64.6738, spread: 0.04, countFactor: 5 },
  { name: "Vobkent", lat: 40.0231, lng: 64.5175, spread: 0.03, countFactor: 3 },
  { name: "Kogon", lat: 39.7214, lng: 64.5517, spread: 0.03, countFactor: 4 },
  { name: "Olot", lat: 39.4144, lng: 63.8058, spread: 0.04, countFactor: 3 },
  { name: "Qorako'l", lat: 39.5167, lng: 63.8333, spread: 0.04, countFactor: 2 },
  { name: "Peshku", lat: 40.0667, lng: 64.3833, spread: 0.04, countFactor: 2 },
  { name: "Shofirkon", lat: 40.1260, lng: 64.5028, spread: 0.04, countFactor: 2 },
  { name: "Jondor", lat: 39.7500, lng: 64.1833, spread: 0.04, countFactor: 2 },

  // Farg'ona
  { name: "Farg'ona shahri", lat: 40.3842, lng: 71.7843, spread: 0.08, countFactor: 12 },
  { name: "Marg'ilon", lat: 40.4722, lng: 71.7144, spread: 0.04, countFactor: 6 },
  { name: "Qo'qon", lat: 40.5286, lng: 70.9425, spread: 0.06, countFactor: 10 },
  { name: "Quva", lat: 40.5222, lng: 72.0625, spread: 0.04, countFactor: 3 },
  { name: "Rishton", lat: 40.3556, lng: 71.2867, spread: 0.04, countFactor: 3 },
  { name: "Beshariq", lat: 40.4358, lng: 70.6094, spread: 0.04, countFactor: 2 },
  { name: "Uchko'prik", lat: 40.5333, lng: 71.0500, spread: 0.04, countFactor: 2 },
  { name: "Oltiariq", lat: 40.3861, lng: 71.4933, spread: 0.04, countFactor: 3 },
  { name: "Toshloq", lat: 40.5186, lng: 71.8483, spread: 0.03, countFactor: 2 },

  // Namangan
  { name: "Namangan shahri", lat: 40.9983, lng: 71.6726, spread: 0.08, countFactor: 12 },
  { name: "Chust", lat: 41.0006, lng: 71.2294, spread: 0.05, countFactor: 5 },
  { name: "Kosonsoy", lat: 41.2564, lng: 71.5544, spread: 0.03, countFactor: 3 },
  { name: "Uychi", lat: 41.0500, lng: 71.9000, spread: 0.04, countFactor: 3 },
  { name: "Pop", lat: 40.8731, lng: 71.1039, spread: 0.05, countFactor: 2 },
  { name: "To'raqo'rg'on", lat: 41.0000, lng: 71.5333, spread: 0.03, countFactor: 3 },
  { name: "Uchqo'rg'on", lat: 41.1167, lng: 72.0833, spread: 0.04, countFactor: 3 },

  // Andijon
  { name: "Andijon shahri", lat: 40.7821, lng: 72.3442, spread: 0.08, countFactor: 12 },
  { name: "Asaka", lat: 40.6406, lng: 72.2272, spread: 0.04, countFactor: 5 },
  { name: "Shahrixon", lat: 40.7094, lng: 72.0525, spread: 0.05, countFactor: 4 },
  { name: "Xo'jaobod", lat: 40.6667, lng: 72.5667, spread: 0.04, countFactor: 3 },
  { name: "Qo'rg'ontepa", lat: 40.7333, lng: 72.7667, spread: 0.05, countFactor: 2 },
  { name: "Buloqboshi", lat: 40.5892, lng: 72.5022, spread: 0.03, countFactor: 2 },
  { name: "Oltinko'l", lat: 40.8000, lng: 72.1667, spread: 0.03, countFactor: 2 },
  { name: "Paxtaobod", lat: 40.9333, lng: 72.2667, spread: 0.04, countFactor: 2 },

  // Qashqadaryo
  { name: "Qarshi shahri", lat: 38.8615, lng: 65.7951, spread: 0.08, countFactor: 10 },
  { name: "Shahrisabz", lat: 39.0560, lng: 66.8282, spread: 0.05, countFactor: 6 },
  { name: "Kitob", lat: 39.1172, lng: 66.8833, spread: 0.04, countFactor: 4 },
  { name: "Muborak", lat: 39.2561, lng: 65.1539, spread: 0.05, countFactor: 3 },
  { name: "Koson", lat: 39.0381, lng: 65.5847, spread: 0.04, countFactor: 3 },
  { name: "G'uzor", lat: 38.6214, lng: 66.2483, spread: 0.04, countFactor: 3 },
  { name: "Qamashi", lat: 38.8167, lng: 66.2667, spread: 0.04, countFactor: 2 },
  { name: "Chiroqchi", lat: 39.0333, lng: 66.5667, spread: 0.05, countFactor: 2 },
  { name: "Dehqonobod", lat: 38.1500, lng: 66.1667, spread: 0.06, countFactor: 2 },

  // Surxondaryo
  { name: "Termiz", lat: 37.2246, lng: 67.2783, spread: 0.06, countFactor: 8 },
  { name: "Denov", lat: 38.2667, lng: 67.8994, spread: 0.04, countFactor: 5 },
  { name: "Boysun", lat: 38.2000, lng: 67.2000, spread: 0.05, countFactor: 3 },
  { name: "Sho'rchi", lat: 38.0167, lng: 67.8000, spread: 0.04, countFactor: 3 },
  { name: "Qumqo'rg'on", lat: 37.8333, lng: 67.6000, spread: 0.04, countFactor: 2 },
  { name: "Sherobod", lat: 37.6667, lng: 67.0000, spread: 0.04, countFactor: 2 },
  { name: "Jarqo'rg'on", lat: 37.5167, lng: 67.4333, spread: 0.03, countFactor: 2 },
  { name: "Uzun", lat: 38.3833, lng: 68.0833, spread: 0.03, countFactor: 2 },

  // Xorazm
  { name: "Urganch", lat: 41.5500, lng: 60.6333, spread: 0.07, countFactor: 8 },
  { name: "Xiva", lat: 41.3783, lng: 60.3639, spread: 0.04, countFactor: 5 },
  { name: "Hazorasp", lat: 41.3167, lng: 61.0667, spread: 0.04, countFactor: 3 },
  { name: "Shovot", lat: 41.6500, lng: 60.3000, spread: 0.04, countFactor: 2 },
  { name: "Xonqa", lat: 41.4500, lng: 60.8167, spread: 0.03, countFactor: 2 },
  { name: "Gurlan", lat: 41.8333, lng: 60.4000, spread: 0.04, countFactor: 2 },
  { name: "Qo'shko'pir", lat: 41.5333, lng: 60.3500, spread: 0.04, countFactor: 2 },

  // Qoraqalpog'iston
  { name: "Nukus", lat: 42.4619, lng: 59.6166, spread: 0.08, countFactor: 8 },
  { name: "Qo'ng'irot", lat: 43.0800, lng: 58.8500, spread: 0.07, countFactor: 3 },
  { name: "Taxiatosh", lat: 42.3000, lng: 59.5667, spread: 0.04, countFactor: 2 },
  { name: "Beruniy", lat: 41.6833, lng: 60.7500, spread: 0.04, countFactor: 3 },
  { name: "To'rtko'l", lat: 41.5500, lng: 61.0000, spread: 0.05, countFactor: 3 },
  { name: "Chimboy", lat: 42.9500, lng: 59.7667, spread: 0.04, countFactor: 2 },
  { name: "Xo'jayli", lat: 42.4000, lng: 59.4500, spread: 0.04, countFactor: 2 },
  { name: "Mo'ynoq", lat: 43.7667, lng: 59.0333, spread: 0.05, countFactor: 1 },

  // Navoiy
  { name: "Navoiy shahri", lat: 40.0844, lng: 65.3792, spread: 0.05, countFactor: 7 },
  { name: "Zarafshon", lat: 41.5833, lng: 64.2000, spread: 0.04, countFactor: 3 },
  { name: "Uchquduq", lat: 42.1500, lng: 63.5500, spread: 0.05, countFactor: 2 },
  { name: "Karmana", lat: 40.1333, lng: 65.3667, spread: 0.04, countFactor: 3 },
  { name: "Qiziltepa", lat: 40.0333, lng: 64.8333, spread: 0.04, countFactor: 3 },
  { name: "Nurota", lat: 40.5667, lng: 65.6833, spread: 0.04, countFactor: 2 },
  
  // Jizzax
  { name: "Jizzax shahri", lat: 40.1158, lng: 67.8422, spread: 0.05, countFactor: 7 },
  { name: "Zomin", lat: 39.9500, lng: 68.4000, spread: 0.06, countFactor: 4 },
  { name: "G'allaorol", lat: 40.0167, lng: 67.5833, spread: 0.05, countFactor: 3 },
  { name: "Paxtakor", lat: 40.3000, lng: 67.9500, spread: 0.04, countFactor: 2 },
  { name: "Mirzacho'l", lat: 40.5000, lng: 68.0333, spread: 0.04, countFactor: 2 },
  { name: "Zafarobod", lat: 40.4000, lng: 67.8500, spread: 0.04, countFactor: 2 },

  // Sirdaryo
  { name: "Guliston", lat: 40.4897, lng: 68.7842, spread: 0.05, countFactor: 5 },
  { name: "Yangiyer", lat: 40.2667, lng: 68.8000, spread: 0.04, countFactor: 3 },
  { name: "Shirin", lat: 40.2333, lng: 69.1333, spread: 0.03, countFactor: 2 },
  { name: "Sirdaryo shahri", lat: 40.8500, lng: 68.6667, spread: 0.04, countFactor: 3 },
  { name: "Boyovut", lat: 40.3500, lng: 68.8833, spread: 0.04, countFactor: 2 },
  { name: "Oqoltin", lat: 40.6167, lng: 68.4167, spread: 0.04, countFactor: 2 },
  { name: "Xovos", lat: 40.2000, lng: 68.8167, spread: 0.04, countFactor: 2 }
]`;

let content = fs.readFileSync('src/lib/mockData.ts', 'utf8');

// Replace UZBEKISTAN_CITIES
content = content.replace(/const UZBEKISTAN_CITIES = \[[\s\S]*?\];/, `const UZBEKISTAN_CITIES = ${extendedCities};`);

// Increase count default to 2000
content = content.replace(/generateMockTrucks\(count: number = 1000\)/, "generateMockTrucks(count: number = 2000)");

fs.writeFileSync('src/lib/mockData.ts', content);

// Also look inside App.tsx where generateMockTrucks is called
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/generateMockTrucks\(\)/, "generateMockTrucks(2000)");

fs.writeFileSync('src/App.tsx', appContent);

console.log('Districts expanded and count increased to 2000');
