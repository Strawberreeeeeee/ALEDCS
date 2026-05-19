const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

// The main element starts here:
const mainStart = code.indexOf('<main className="flex flex-1 overflow-hidden relative">');
const mainEnd = code.indexOf('</main>') + '</main>'.length;

const mainBlock = code.slice(mainStart, mainEnd);

// Extractor helper
function extract(startStr, endStr, fromBlock = mainBlock, offsetEnd = false) {
    const s = fromBlock.indexOf(startStr);
    if (s === -1) return '';
    let e = fromBlock.indexOf(endStr, s);
    if (e === -1) return '';
    if (offsetEnd) e += endStr.length;
    return fromBlock.slice(s, e);
}

// Extract editor tab bar
const editorTabBar = extract(
    '<div className="flex bg-[#252526] h-9 border-b border-[#1A1A1A] items-center justify-between pr-4">',
    '</div>\n\n                    <div className="flex-1 relative overflow-hidden">'
) + '</div>';

// Extract editor body
// starts at: <div className="flex-1 relative overflow-hidden">
// ends where we find the closing div of Panel id="editor-panel", let's use the panel end
const editorBodyStart = '<div className="flex-1 relative overflow-hidden">';
let edStartPos = mainBlock.indexOf(editorBodyStart);
// Wait, to safely grab the editor, let's grab from editorBodyStart up to the AI panel start!
const aiPanelStart = '{showAI && (';
let aiPos = mainBlock.indexOf(aiPanelStart);
let editorBody = mainBlock.slice(edStartPos, aiPos);
// trim the closing </Panel>
editorBody = editorBody.substring(0, editorBody.lastIndexOf('</Panel>'));

// AI panel body (inside showAI)
let aiPanelBody = mainBlock.slice(aiPos);
const termStart = '{isBottomPanelVisible && (';
let termPos = aiPanelBody.indexOf(termStart);
let aiBodyStr = aiPanelBody.slice(0, termPos);
// extract just the inner div tree from aiBodyStr
const aiInnerStart = '<div className="flex flex-col h-full overflow-hidden">';
let aiInnerPos = aiBodyStr.indexOf(aiInnerStart);
let aiFinal = '';
if (aiInnerPos !== -1) {
    aiFinal = aiBodyStr.slice(aiInnerPos);
    aiFinal = aiFinal.substring(0, aiFinal.lastIndexOf('</Panel>'));
    aiFinal = aiFinal.substring(0, aiFinal.lastIndexOf(')}')); // remove the closing )}
} else {
    // maybe it starts with <div className="flex flex-col h-full
    aiFinal = extract('<div className="flex flex-col h-full', '</Panel>', aiBodyStr);
}

// Terminal body
let termBodyStr = aiPanelBody.slice(termPos);
// extract just the inner div
let termFinal = extract('<div className="flex flex-col h-full bg-[#1e1e1e]', '</Panel>', termBodyStr);

// Output the new main structure
const newMain = `
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: 0,          // critical: prevents grid row from expanding
        width: '100%',
      }}>

        {/* ── LEFT SIDEBAR ─────────────────────────── */}
        <aside style={{
          width:    panels.sidebar ? '275px' : '0px',
          minWidth: panels.sidebar ? '275px' : '0px',  // ← THE FIX
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 200ms ease, min-width 200ms ease',
          background: '#1a1d23',
          borderRight: panels.sidebar ? '1px solid #2d3139' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <SidebarContent />
        </aside>

        {/* ── CENTER COLUMN ────────────────────────── */}
        <div style={{
          flex: '1 1 0',   // takes all remaining space
          minWidth: 0,     // critical: allows Monaco to shrink
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Editor — fills available height */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            ${editorTabBar}
            ${editorBody}
          </div>
          
          {/* Terminal — fixed height when open */}
          <div style={{
            height:    panels.terminal ? '190px' : '0px',
            minHeight: panels.terminal ? '190px' : '0px',  // ← THE FIX
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'height 200ms ease, min-height 200ms ease',
            borderTop: panels.terminal ? '1px solid #2d3139' : 'none',
            background: '#1e1e1e',
          }}>
            ${termFinal}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR (AI) ───────────────────── */}
        <aside style={{
          width:    panels.agent ? '300px' : '0px',
          minWidth: panels.agent ? '300px' : '0px',  // ← THE FIX
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 200ms ease, min-width 200ms ease',
          background: '#1e1e1e',
          borderLeft: panels.agent ? '1px solid #2d3139' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}>
           ${aiFinal}
        </aside>

      </div>

      <footer className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[9px] shrink-0 font-mono z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 opacity-90 hover:opacity-100 cursor-pointer transition-opacity">
            <XCircle className="w-3 h-3" /> 0 
            <AlertTriangle className="w-3 h-3 ml-1" /> 0
          </div>
          <div className="hidden sm:flex items-center gap-1 opacity-90">
            <Radio className="w-3 h-3" /> Ready
          </div>
        </div>
        <div className="flex items-center gap-4 opacity-90">
          <span className="hidden xs:inline hover:bg-white/10 px-1 rounded cursor-pointer transition-colors">Ln {editorRef.current?.getPosition()?.lineNumber || 1}, Col {editorRef.current?.getPosition()?.column || 1}</span>
          <span className="cursor-pointer hover:bg-white/10 px-1 rounded transition-colors">Spaces: 4</span>
          <span className="cursor-pointer hover:bg-white/10 px-1 rounded transition-colors hidden sm:inline">UTF-8</span>
          <span className="cursor-pointer hover:bg-white/10 px-1 rounded transition-colors font-bold">C</span>
        </div>
      </footer>
`;

const finalCode = code.slice(0, mainStart) + newMain + code.slice(mainEnd);

fs.writeFileSync('src/App.tsx', finalCode);
