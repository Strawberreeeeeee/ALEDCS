const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace the state vars
content = content.replace('const handleLogin = async () => {', `
  const windowWidth = useWindowWidth();
  const isCompact = windowWidth < 1100;
  const isNarrow = windowWidth < 800;

  interface PanelState {
    sidebar: boolean;
    terminal: boolean;
    agent: boolean;
  }
  const [panels, setPanels] = useState<PanelState>({
    sidebar: true,
    terminal: true,
    agent: true,
  });
  const togglePanelState = (key: keyof PanelState) => setPanels(p => ({ ...p, [key]: !p[key] }));

  // Keep old state names mapping to new object
  const isSidebarVisible = panels.sidebar;
  const isBottomPanelVisible = panels.terminal;
  const showAI = panels.agent;
  const setIsSidebarVisible = (val: boolean) => setPanels(p => ({...p, sidebar: val}));
  const setIsBottomPanelVisible = (val: boolean) => setPanels(p => ({...p, terminal: val}));
  const setShowAI = (val: boolean) => setPanels(p => ({...p, agent: val}));

  const handleLogin = async () => {
`);

// remove old state declarations
content = content.replace(/const \[isSidebarVisible, setIsSidebarVisible\][^\;]*\;/g, '');
content = content.replace(/const \[isBottomPanelVisible, setIsBottomPanelVisible\][^\;]*\;/g, '');
content = content.replace(/const \[showAI, setShowAI\] = useState\(true\)\;/g, '');

// Also remove the localStorage initializers for those three since they were multiline blocks:
content = content.replace(/const \[isSidebarVisible, setIsSidebarVisible\] = useState\(\(\) => \{[\s\S]*?\}\)\;/m, '');
content = content.replace(/const \[isBottomPanelVisible, setIsBottomPanelVisible\] = useState\(\(\) => \{[\s\S]*?\}\)\;/m, '');


// remove old toggles
content = content.replace('const togglePrimarySidebar = () => setIsSidebarVisible(!isSidebarVisible);', '');
content = content.replace('const togglePanel = () => setIsBottomPanelVisible(!isBottomPanelVisible);', '');
content = content.replace('const toggleAgent = () => setShowAI(!showAI);', '');

fs.writeFileSync('src/App.tsx', content);
