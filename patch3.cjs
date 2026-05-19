const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The new header block
const newHeader = `
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 10px',
        height: 40,
        overflow: 'hidden',
        background: '#0f1117',
        borderBottom: '1px solid #2d3139',
      }}>

        {/* Left — never shrink */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {screenSize === "mobile" && (
            <button
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              className="p-1 hover:bg-white/5 rounded text-blue-400"
            >
              {isSidebarVisible ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          <div className="text-blue-400 font-bold tracking-tight text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            <span className="hidden xs:inline">ALEDCS</span>
          </div>
          <div className="h-4 w-px bg-[#454545] hidden sm:block"></div>
          
          <button
            onClick={() => setIsCreatingProject(true)}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 rounded text-[10px] font-bold uppercase tracking-wider text-blue-400 transition-all border border-blue-500/20"
          >
            <Plus className="w-3 h-3" />
            New Project
          </button>
        </div>

        {/* Center — absorbs leftover space, hides labels when narrow */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          flex: '1 1 auto', justifyContent: 'center',
          minWidth: 0, overflow: 'hidden',
        }}>
          {/* Panel toggles — always icon-only, no text */}
          <IconButton onClick={() => togglePanelState('sidebar')} active={panels.sidebar} title="Toggle Sidebar">
            <PanelLeft size={15} />
          </IconButton>
          <IconButton onClick={() => togglePanelState('terminal')} active={panels.terminal} title="Toggle Terminal">
            <PanelBottom size={15} />
          </IconButton>
          <IconButton onClick={() => togglePanelState('agent')} active={panels.agent} title="Toggle AI Panel">
            <PanelRight size={15} />
          </IconButton>

          {/* Compile button — always visible */}
          <button 
            onClick={handleCompile}
            disabled={isCompiling}
            style={{ flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', padding: '4px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 4, cursor: isCompiling ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 'bold' }}
          >
            {isCompiling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
            ) : (
              <Play className="w-3 h-3 fill-current mr-2" />
            )}
            Compile & Run
          </button>

          {/* Toolbar buttons — hide text labels when isCompact, hide button when isNarrow */}
          {!isNarrow && (
            <>
              <ToolbarBtn icon={<RefreshCw size={13} className={isFormatting ? "animate-spin" : ""} />} label={isCompact ? '' : 'FORMAT'} onClick={handleFormat} />
              <ToolbarBtn icon={<Save size={13} className={isSavingVersion ? "animate-pulse" : ""} />} label={isCompact ? '' : 'SAVE SNAPSHOT'} onClick={saveVersion} />
              {!isCompact && <ToolbarBtn icon={<Sparkles size={13} />} label="SNIPPETS" onClick={() => {}} />}
              {!isCompact && <ToolbarBtn icon={<Layers size={13} />} label="LINTER" onClick={() => setShowSettings(!showSettings)} />}
            </>
          )}
        </div>

        {/* Right — never shrink */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-5 h-5 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="text-[10px] font-bold opacity-70 hidden sm:inline uppercase tracking-wider">
                  {user.displayName || "Student"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="opacity-50 hover:opacity-100 transition-all p-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="text-[10px] font-bold uppercase tracking-widest bg-white bg-opacity-5 hover:bg-opacity-10 px-3 py-1 rounded border border-white border-opacity-10 transition-all font-mono"
            >
              Sign In
            </button>
          )}
        </div>
      </header>
`;

// Now let's try replacing the old header
const oldHeaderStart = content.indexOf('<header className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-[#1A1A1A] shrink-0 z-20">');
const oldHeaderEnd = content.indexOf('</header>', oldHeaderStart) + '</header>'.length;
content = content.slice(0, oldHeaderStart) + newHeader + content.slice(oldHeaderEnd);

// Wrap root container
content = content.replace('<div className="flex flex-col h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)] font-sans">', 
`<div style={{
      display: 'grid',
      gridTemplateRows: '40px 35px 1fr 24px', // topbar | tabbar | content | statusbar
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0f1117',
      color: '#e6edf3',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 13,
    }}>`);

fs.writeFileSync('src/App.tsx', content);
