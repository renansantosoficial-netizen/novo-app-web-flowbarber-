const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const startIndex = content.indexOf('const CalendarGrid = ({ data, selectedDate,');
if (startIndex === -1) {
  console.log('CalendarGrid not found');
  process.exit(1);
}

const endIndex = content.indexOf('const Popup = React.forwardRef<HTMLDivElement,');
if (endIndex === -1) {
  console.log('Popup not found');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + content.substring(endIndex);
fs.writeFileSync('src/App.tsx', newContent);
console.log('Removed CalendarGrid from App.tsx');
