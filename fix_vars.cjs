const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find the block we injected
const injectStart = code.indexOf('  const windowWidth = useWindowWidth();');
const injectEnd = code.indexOf('  const handleLogin = async () => {', injectStart);
const injectedBlock = code.slice(injectStart, injectEnd);

// Remove the injected block from there
code = code.replace(injectedBlock, '');

// Insert it instead right after `const [sidebarTab, setSidebarTab] = useState<"history" | "versions">("history");`
const targetPoint = code.indexOf('("history");\n') + '("history");\n'.length;

code = code.slice(0, targetPoint) + '\n' + injectedBlock + code.slice(targetPoint);

// Also remove missing unused icons: XCircle, AlertTriangle, Radio
code = code.replace(/<XCircle className="w-3 h-3" \/>/g, '');
code = code.replace(/<AlertTriangle className="w-3 h-3 ml-1" \/>/g, '');
code = code.replace(/<Radio className="w-3 h-3" \/>/g, '');

// And fix toggleAgent error: we'll just implement it locally near the keybinding at 2442 since we lost the top-level alias
code = code.replace('toggleAgent();', 'togglePanelState("agent");');

fs.writeFileSync('src/App.tsx', code);
