const fs = require('fs');
let c = fs.readFileSync('src/index.css', 'utf8');

c = c.replace(/\.marker-cluster-small, \.marker-cluster-medium, \.marker-cluster-large \{[\s\S]*?\}/g, `.marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
  background-color: rgba(37, 99, 235, 0.3) !important;
  border-radius: 50% !important;
}`);

c = c.replace(/\.marker-cluster-small div, \.marker-cluster-medium div, \.marker-cluster-large div \{[\s\S]*?\}/g, `.marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
  background-color: rgba(37, 99, 235, 1) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4) !important;
  font-weight: 700 !important;
}`);

fs.writeFileSync('src/index.css', c);
console.log('Fixed cluster colors to solid blue');
