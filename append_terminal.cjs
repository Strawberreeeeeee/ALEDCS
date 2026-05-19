const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I need to replace the placeholder we had for terminal
const searchStr = `          {/* Terminal — fixed height when open */}
          <div style={{
            height:    panels.terminal ? '190px' : '0px',
            minHeight: panels.terminal ? '190px' : '0px',  // ← THE FIX
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'height 200ms ease, min-height 200ms ease',
            borderTop: panels.terminal ? '1px solid #2d3139' : 'none',
            background: '#1e1e1e',
          }}>
            
          </div>`;

const newStr = `          {/* Terminal — fixed height when open */}
          <div style={{
            height:    panels.terminal ? '250px' : '0px',
            minHeight: panels.terminal ? '250px' : '0px',  // ← THE FIX
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'height 200ms ease, min-height 200ms ease',
            borderTop: panels.terminal ? '1px solid #2d3139' : 'none',
            background: '#1e1e1e',
          }}>
              <div className="h-full w-full flex flex-col">
                <div className="bg-[#252526] h-8 border-b border-[#333] flex items-center px-4 shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" /> Output
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-gray-300">
                  {isDebugging ? (
                    <div>
                        <div className="text-yellow-500 mb-2 font-bold">Debug Mode Active</div>
                        <div>Step: {currentStepIndex} / {debugSteps.length}</div>
                        <div className="mt-2 text-[9px] uppercase font-bold text-gray-500">Output Log:</div>
                        <pre className="text-gray-300 whitespace-pre-wrap">{debugSteps[currentStepIndex]?.output || output}</pre>
                    </div>
                  ) : (
                    output ? output.split("\\n").map((line, i) => {
                      const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("failed");
                      const isWarning = line.toLowerCase().includes("warning");
                      let textColor = "text-gray-300";
                      if (isError) textColor = "text-red-400";
                      else if (isWarning) textColor = "text-yellow-400";
                      return (
                        <div key={i} className={\`flex gap-3 hover:bg-white/5 px-2 rounded-sm transition-colors \${textColor}\`}>
                          <span className="opacity-30 select-none w-6 text-right shrink-0">{i + 1}</span>
                          <span className="break-all">{line}</span>
                        </div>
                      );
                    }) : <div className="opacity-30 italic">Terminal ready...</div>
                  )}
                </div>
              </div>
          </div>`;

if (code.includes(searchStr)) {
   code = code.replace(searchStr, newStr);
   fs.writeFileSync('src/App.tsx', code);
   console.log("Terminal successfully injected!");
} else {
   console.log("Could not find the target string!");
}
