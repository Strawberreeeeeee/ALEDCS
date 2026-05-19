const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the layout state leftovers
code = code.replace(/    return saved !== null \? JSON\.parse\(saved\) : true;\n  \}\);\n/g, '');

// Save
fs.writeFileSync('src/App.tsx', code);
