const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const startIndex = content.indexOf('const Popup = React.forwardRef');
if (startIndex === -1) {
  console.log('Popup not found');
  process.exit(1);
}

const endIndex = content.indexOf('Popup.displayName = \'Popup\';');
if (endIndex === -1) {
  console.log('Popup displayName not found');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + content.substring(endIndex + 'Popup.displayName = \'Popup\';'.length);
fs.writeFileSync('src/App.tsx', newContent);
console.log('Removed Popup from App.tsx');
