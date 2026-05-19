const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace("gridTemplateRows: '40px 35px 1fr 24px'", "gridTemplateRows: '40px 1fr 24px'");
fs.writeFileSync('src/App.tsx', content);
