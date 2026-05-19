import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import {
  Play,
  Terminal,
  Code2,
  Info,
  Trash2,
  Loader2,
  ChevronRight,
  FileCode,
  Sparkles,
  RefreshCw,
  LogOut,
  User as UserIcon,
  LogIn,
  History,
  Clock,
  FolderPlus,
  TestTube,
  Save,
  Package,
  Layers,
  Search,
  Plus,
  Clipboard,
  Download,
  Upload,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Maximize2,
  Menu,
  X,
  Sun,
  Moon,
  HelpCircle,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ─── Animation Constants ────────────────────────────────────────────────────
const SPRING = { type: "spring", stiffness: 300, damping: 28 } as const;
const EASE_OUT = { duration: 0.2, ease: [0, 0, 0.2, 1] } as const;
const EASE_IN_OUT = { duration: 0.22, ease: [0.4, 0, 0.2, 1] } as const;
const STAGGER = { staggerChildren: 0.04 } as const;
// ────────────────────────────────────────────────────────────────────────────
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
} from "./lib/firebase";

const INITIAL_CODE = `#include <stdio.h>\n\nint main() {\n    printf("Hello ALEDCS!\\n");\n    return 0;\n}\n`;

const SNIPPETS = [
  {
    category: 'Basic Syntax',
    items: [
      { title: 'Main Function',  code: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}' },
      { title: 'For Loop',       code: 'for (int i = 0; i < n; i++) {\n    \n}' },
      { title: 'While Loop',     code: 'int i = 0;\nwhile (i < n) {\n    i++;\n}' },
      { title: 'If-Else',        code: 'if (condition) {\n    \n} else {\n    \n}' },
      { title: 'Switch Case',    code: 'switch (x) {\n    case 1:\n        break;\n    default:\n        break;\n}' },
    ],
  },
  {
    category: 'Functions',
    items: [
      { title: 'Function Def',   code: 'int functionName(int a, int b) {\n    return a + b;\n}' },
      { title: 'Void Function',  code: 'void functionName() {\n    \n}' },
      { title: 'Printf',         code: 'printf("%d\\n", value);' },
      { title: 'Scanf',          code: 'scanf("%d", &variable);' },
    ],
  },
  {
    category: 'Data',
    items: [
      { title: 'Array',          code: 'int arr[10] = {0};' },
      { title: 'String',         code: 'char str[100] = "";' },
      { title: 'Struct',         code: 'struct Name {\n    int field;\n    char name[50];\n};' },
      { title: 'Pointer',        code: 'int *ptr = &variable;' },
    ],
  },
];

// ─── Tour Step Definitions ───────────────────────────────────────────────────
interface TourStep {
  id: string;           // matches data-tour="id" attribute on the target element
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',          // no element has data-tour="welcome", so rect will be null
    title: 'Welcome to ALEDCS! 👋',
    description: 'Your AI-powered C programming IDE. This quick tour will show you the key features. It only takes a minute!',
    position: 'bottom',
    icon: '👋',
  },
  {
    id: 'toolbar-compile',
    title: '▶ Compile & Run',
    description: 'Click here to compile your C code. Our AI-powered virtual GCC compiler will analyze it instantly and show any errors with explanations.',
    position: 'bottom',
    icon: '🚀',
  },
  {
    id: 'monaco-editor',
    title: 'Code Editor',
    description: 'Write your C code here. The editor has syntax highlighting, auto-completion, and will underline errors in red after you compile.',
    position: 'right',
    icon: '✏️',
  },
  {
    id: 'ai-panel',
    title: 'Gemini AI Assistant',
    description: 'Your personal AI tutor. After compiling, it explains errors in simple terms. You can also ask it questions about your code anytime.',
    position: 'left',
    icon: '🤖',
  },
  {
    id: 'terminal-panel',
    title: 'Terminal Output',
    description: 'See your program\'s output here after compilation. Green means success, red means there are errors to fix.',
    position: 'top',
    icon: '💻',
  },
  {
    id: 'sidebar-explorer',
    title: 'File Explorer',
    description: 'Manage your C files here. Click + to create new files, right-click to rename or delete.',
    position: 'right',
    icon: '📁',
  },
  {
    id: 'sidebar-history',
    title: 'Compile History',
    description: 'Every compile session is saved here automatically. Click any entry to restore that code to the editor.',
    position: 'right',
    icon: '📋',
  },
  {
    id: 'toolbar-snippets',
    title: 'Code Snippets',
    description: 'Quickly insert common C patterns like for loops, functions, and structs. Great for beginners!',
    position: 'bottom',
    icon: '⚡',
  },
  {
    id: 'learning-center',
    title: 'Learning Center',
    description: 'New to C? Select a topic here to see explanations and examples for Variables, Loops, Functions, Pointers, and more.',
    position: 'right',
    icon: '📚',
  },
  {
    id: 'toolbar-debug',
    title: 'Debug Mode',
    description: 'After compiling, click Debug to step through your code line by line, watch variable values change, and understand exactly how your program runs.',
    position: 'bottom',
    icon: '🔍',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

// ─── Adaptive ML: Student Error Profile Builder ───────────────────────────────
// Analyzes the student's compile history to find recurring error patterns.
// This implements user-adaptive machine learning without external ML libraries.

interface ErrorProfile {
  profileText: string;         // injected into Gemini prompt
  topErrors: string[];         // for UI display
  sessionCount: number;        // how many sessions were analyzed
}

function buildErrorProfile(history: HistoryItem[]): ErrorProfile {
  if (!history || history.length === 0) {
    return { profileText: '', topErrors: [], sessionCount: 0 };
  }

  // Only analyze the most recent 20 sessions for relevance
  const recent = history.slice(0, 20);

  // Error pattern definitions — regex matched against GCC-style output
  const patterns: { key: string; label: string; regex: RegExp }[] = [
    {
      key: 'missing_semicolon',
      label: 'frequently forgets semicolons at the end of statements',
      regex: /expected\s*';'/gi,
    },
    {
      key: 'undeclared_identifier',
      label: 'often uses variables or functions without declaring them first',
      regex: /undeclared|implicit declaration/gi,
    },
    {
      key: 'type_mismatch',
      label: 'struggles with data type compatibility and conversions',
      regex: /incompatible|wrong type|cannot convert|invalid conversion/gi,
    },
    {
      key: 'missing_return',
      label: 'commonly forgets return statements in non-void functions',
      regex: /control reaches end|no return|return type/gi,
    },
    {
      key: 'mismatched_braces',
      label: 'has difficulty matching opening and closing braces or parentheses',
      regex: /expected\s*'\}'|expected\s*'\{'|expected\s*'\)'/gi,
    },
    {
      key: 'wrong_format_specifier',
      label: 'misuses printf/scanf format specifiers (%d, %f, %s, %c)',
      regex: /format\s+'%|format specif/gi,
    },
    {
      key: 'uninitialized_variable',
      label: 'sometimes uses variables without initializing them',
      regex: /uninitialized|may be used uninitialized/gi,
    },
    {
      key: 'array_out_of_bounds',
      label: 'may be making array indexing mistakes',
      regex: /array.*bound|index.*out|subscript/gi,
    },
  ];

  // Count error occurrences across all recent sessions
  const frequency: Record<string, number> = {};

  recent.forEach(item => {
    const output = item.output || '';
    patterns.forEach(({ key, regex }) => {
      const matches = output.match(regex);
      if (matches && matches.length > 0) {
        frequency[key] = (frequency[key] || 0) + matches.length;
      }
    });
  });

  // Sort by frequency, take top 3
  const sorted = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (sorted.length === 0) {
    return { profileText: '', topErrors: [], sessionCount: recent.length };
  }

  const topErrors = sorted.map(([key]) =>
    patterns.find(p => p.key === key)?.label || key
  );

  const profileLines = topErrors
    .map(label => `- This student ${label}.`)
    .join('\n');

  const profileText = `
ADAPTIVE STUDENT PROFILE (machine-learned from ${recent.length} compile sessions):
${profileLines}
Based on this profile:
- Give extra attention and simpler analogies specifically for these recurring error types.
- If any of these error types appear in the current code, flag them prominently in your explanation.
- Encourage the student about their specific weak areas without being discouraging.
`.trim();

  return { profileText, topErrors, sessionCount: recent.length };
}
// ─────────────────────────────────────────────────────────────────────────────

interface HistoryItem {
  id: string;
  projectId?: string;
  code: string;
  output: string;
  explanation?: string;
  createdAt: any;
}

import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";

const VariableTree = ({ name, value, depth = 0, isLastChanged = false }: any) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const isObject = typeof value === "object" && value !== null;
  const isArray = Array.isArray(value);
  const label = isArray ? "[]" : isObject ? "{}" : "";

  if (!isObject) {
    return (
      <div
        className={`flex justify-between border-b border-white/5 pb-0.5 transition-all text-[11px] ${isLastChanged ? "bg-yellow-500/20 text-yellow-200 font-bold px-1 rounded" : ""}`}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <span className="text-orange-300">{name}:</span>
        <span className="text-green-300 ml-2">{String(value)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-[11px]">
      <div
        className="flex items-center gap-1 cursor-pointer hover:bg-white/5 py-0.5"
        style={{ paddingLeft: `${depth * 12}px` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronRight
          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />
        <span className="text-orange-300 font-bold">{name}</span>
        <span className="text-gray-500 text-[10px] ml-1">{label}</span>
      </div>
      {isExpanded && (
        <div className="flex flex-col">
          {Object.entries(value).map(([childName, childValue]) => (
            <VariableTree
              key={childName}
              name={childName}
              value={childValue}
              depth={depth + 1}
              isLastChanged={isLastChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
};


interface IconButtonProps {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}
const IconButton: React.FC<IconButtonProps> = ({ onClick, active, title, children }) => (
  <motion.button 
    onClick={onClick} 
    title={title} 
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={SPRING}
    style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
    background: active ? '#1f2937' : 'transparent',
    color: active ? '#58a6ff' : '#8b949e',
  }}>
    {children}
  </motion.button>
);

interface ToolbarBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  'data-tour'?: string;
}
const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ icon, label, onClick, 'data-tour': dataTour }) => (
  <motion.button 
    data-tour={dataTour} 
    onClick={onClick} 
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={SPRING}
    style={{
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
    background: 'transparent', border: '1px solid #2d3139', borderRadius: 5,
    color: '#8b949e', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap',
  }}>
    {icon}{label}
  </motion.button>
);

const useWindowWidth = (): number => {
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
};

export default function App() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [codeSelection, setCodeSelection] = useState("");
  const [output, setOutput] = useState(
    "ALEDCS GCC v11.4.0 (Ubuntu) compiler initialized.\nReady to compile and run.",
  );
  const [isCompiling, setIsCompiling] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [isExplaining, setIsExplaining] = useState(false);
  const [files, setFiles] = useState<{ name: string; content: string }[]>([
    {
      name: "main.c",
      content:
        '#include <stdio.h>\n\nint main() {\n    printf("ALEDCS Virtual Compiler Ready!\\n");\n    return 0;\n}',
    },
  ]);
  const [activeFile, setActiveFile] = useState("main.c");
  
  const [errorProfile, setErrorProfile] = useState<ErrorProfile>({
    profileText: '',
    topErrors: [],
    sessionCount: 0,
  });

  const [tourStep, setTourStep] = useState<number>(-1); // -1 = inactive
  const [tourTargetRect, setTourTargetRect] = useState<DOMRect | null>(null);
  const [isTourVisible, setIsTourVisible] = useState(false);

  // Start the tour
  const startTour = () => {
    setTourStep(0);
    setIsTourVisible(true);
  };

  // End the tour (skip or complete)
  const endTour = () => {
    setIsTourVisible(false);
    setTourStep(-1);
    localStorage.setItem('aledcs_tour_done', 'true');
  };

  // Move to a specific step and measure the target element
  const goToStep = (index: number) => {
    if (index < 0 || index >= TOUR_STEPS.length) {
      endTour();
      return;
    }
    setTourStep(index);
    // Measure the target element position
    const step = TOUR_STEPS[index];
    const target = document.querySelector(`[data-tour="${step.id}"]`);
    if (target) {
      setTourTargetRect(target.getBoundingClientRect());
    } else {
      setTourTargetRect(null);
    }
  };

  // Auto-start on first visit
  useEffect(() => {
    const tourDone = localStorage.getItem('aledcs_tour_done');
    if (!tourDone) {
      // Small delay so the UI finishes rendering before tour starts
      const timer = setTimeout(() => startTour(), 1200);
      return () => clearTimeout(timer);
    }
  }, []); // runs once on mount

  // Update target rect when step changes or window resizes
  useEffect(() => {
    if (tourStep < 0) return;
    goToStep(tourStep);

    const handleResize = () => goToStep(tourStep);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tourStep]);

  // Debugging State
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugSteps, setDebugSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [breakpoints, setBreakpoints] = useState<
    Record<number, { condition: string }>
  >({});
  const [watchVars, setWatchVars] = useState<string[]>([]);
  const [watchConditions, setWatchConditions] = useState<
    Record<string, string>
  >({});
  const [watchLogs, setWatchLogs] = useState<string[]>([]);
  const [lastChangedVars, setLastChangedVars] = useState<Set<string>>(
    new Set(),
  );

  // Auto-save/load debugger state
  useEffect(() => {
    const savedBreakpoints = localStorage.getItem("aledcs_breakpoints");
    const savedWatchVars = localStorage.getItem("aledcs_watchVars");
    const savedWatchConditions = localStorage.getItem("aledcs_watchConditions");

    if (savedBreakpoints) setBreakpoints(JSON.parse(savedBreakpoints));
    if (savedWatchVars) setWatchVars(JSON.parse(savedWatchVars));
    if (savedWatchConditions)
      setWatchConditions(JSON.parse(savedWatchConditions));
  }, []);

  useEffect(() => {
    localStorage.setItem("aledcs_breakpoints", JSON.stringify(breakpoints));
  }, [breakpoints]);

  useEffect(() => {
    localStorage.setItem("aledcs_watchVars", JSON.stringify(watchVars));
  }, [watchVars]);

  useEffect(() => {
    localStorage.setItem(
      "aledcs_watchConditions",
      JSON.stringify(watchConditions),
    );
  }, [watchConditions]);

  // Monaco decorations
  const breakpointDecorationsRef = useRef<string[]>([]);
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const newDecorations = Object.entries(breakpoints).map(
      ([line, info]: [string, any]) => ({
        range: new monaco.Range(Number(line), 1, Number(line), 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: info.condition
            ? "conditional-breakpoint-margin"
            : "breakpoint-margin",
          glyphMarginHoverMessage: {
            value: info.condition
              ? `**Conditional Breakpoint:** \`${info.condition}\``
              : "**Breakpoint**",
          },
        },
      }),
    );

    breakpointDecorationsRef.current = editor.deltaDecorations(
      breakpointDecorationsRef.current,
      newDecorations,
    );
  }, [breakpoints]);

  // History Search
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "today" | "week">(
    "all",
  );
  const [sidebarTab, setSidebarTab] = useState<"history" | "versions">(
    "history",
  );

  const windowWidth = useWindowWidth();
  const isCompact = windowWidth < 1100;
  const isNarrow = windowWidth < 800;

  const [sidebarWidth, setSidebarWidth]   = useState(275);
  const [agentWidth, setAgentWidth]       = useState(300);
  const [terminalHeight, setTerminalHeight] = useState(190);

  const SIDEBAR_MIN = 200; const SIDEBAR_MAX = 450;
  const AGENT_MIN   = 240; const AGENT_MAX   = 500;
  const TERMINAL_MIN = 120; const TERMINAL_MAX = 400;

  const useDrag = (
    onDelta: (delta: number) => void,
    axis: 'x' | 'y' = 'x'
  ) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      const startPos = axis === 'x' ? e.clientX : e.clientY;

      const onMove = (ev: MouseEvent) => {
        onDelta(axis === 'x' ? ev.clientX - startPos : ev.clientY - startPos);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
  };

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


  // Layout State
  
  
  const [sidebarPosition, setSidebarPosition] = useState<"left" | "right">(() => {
    return (localStorage.getItem("aledcs_layout_position") as "left" | "right") || "left";
  });
  
  // Actually we need `showAI` to be persisted too, wait, `showAI` is defined above. Let's persist it by adding `useEffect`.
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "laptop">("laptop");

  
  
  

  useEffect(() => {
    localStorage.setItem("aledcs_layout_sidebar", JSON.stringify(isSidebarVisible));
  }, [isSidebarVisible]);

  useEffect(() => {
    localStorage.setItem("aledcs_layout_bottom", JSON.stringify(isBottomPanelVisible));
  }, [isBottomPanelVisible]);

  useEffect(() => {
    localStorage.setItem("aledcs_layout_position", sidebarPosition);
  }, [sidebarPosition]);

  useEffect(() => {
    localStorage.setItem("aledcs_layout_agent", JSON.stringify(showAI));
  }, [showAI]);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      let size: "mobile" | "tablet" | "laptop" = "laptop";
      if (width < 768) size = "mobile";
      else if (width < 1280) size = "tablet";
      
      setScreenSize(size);
      
      if (size === "mobile") {
        setIsSidebarVisible(false);
        setShowAI(false);
        setIsBottomPanelVisible(false);
      } else if (size === "tablet") {
        setIsSidebarVisible(true);
        setShowAI(false);
        setIsBottomPanelVisible(true);
      } else {
        const savedSidebar = localStorage.getItem("aledcs_layout_sidebar");
        if (savedSidebar !== null) setIsSidebarVisible(JSON.parse(savedSidebar));
        else setIsSidebarVisible(true);
        
        const savedAgent = localStorage.getItem("aledcs_layout_agent");
        if (savedAgent !== null) setShowAI(JSON.parse(savedAgent));
        else setShowAI(true);
        
        const savedBottom = localStorage.getItem("aledcs_layout_bottom");
        if (savedBottom !== null) setIsBottomPanelVisible(JSON.parse(savedBottom));
        else setIsBottomPanelVisible(true);
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>("default");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Version Control
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

  const saveDebugSession = () => {
    const session = {
      breakpoints,
      watchVars,
      watchConditions,
    };
    const blob = new Blob([JSON.stringify(session)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug_session_${activeFile.replace(".c", "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadDebugSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const session = JSON.parse(event.target?.result as string);
          if (session.breakpoints) {
            // Handle legacy breakpoints array if needed
            if (Array.isArray(session.breakpoints)) {
              const newBreakpoints: Record<number, { condition: string }> = {};
              session.breakpoints.forEach((val: any) => {
                const line = typeof val === "number" ? val : val.line;
                newBreakpoints[line] = {
                  condition: typeof val === "object" ? val.condition || "" : "",
                };
              });
              setBreakpoints(newBreakpoints);
            } else {
              setBreakpoints(session.breakpoints);
            }
          }
          if (session.watchVars) setWatchVars(session.watchVars);
          if (session.watchConditions)
            setWatchConditions(session.watchConditions);
          alert("Debug session restored!");
        } catch (err) {
          alert("Invalid debug session file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleBreakpoint = (line: number) => {
    setBreakpoints((prev) => {
      const next = { ...prev };
      if (next[line]) {
        delete next[line];
      } else {
        next[line] = { condition: "" };
      }
      return next;
    });
  };

  // Monaco Refs
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const lintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auth & Database State
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user profile exists
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          try {
            await setDoc(userRef, {
              userId: currentUser.uid,
              displayName: currentUser.displayName || "Student",
              email: currentUser.email || "",
              createdAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(
              err,
              OperationType.WRITE,
              `users/${currentUser.uid}`,
            );
          }
        }
      } else {
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for history updates
  useEffect(() => {
    if (!user) return;

    setIsLoadingHistory(true);
    const historyRef = collection(db, "users", user.uid, "history");
    const q = query(historyRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: HistoryItem[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as HistoryItem,
        );
        setHistory(items);
        setIsLoadingHistory(false);
      },
      (err) => {
        handleFirestoreError(
          err,
          OperationType.LIST,
          `users/${user.uid}/history`,
        );
        setIsLoadingHistory(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // Rebuild adaptive error profile whenever history updates
  useEffect(() => {
    if (history && history.length > 0) {
      const profile = buildErrorProfile(history);
      setErrorProfile(profile);
    }
  }, [history]);

  // Listen for projects and versions
  useEffect(() => {
    if (!user) return;

    const projectsRef = collection(db, "users", user.uid, "projects");
    const unsubProjects = onSnapshot(projectsRef, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProjects(items);
    });

    const versionsRef = collection(db, "users", user.uid, "versions");
    const qVersions = query(versionsRef, orderBy("createdAt", "desc"));
    const unsubVersions = onSnapshot(qVersions, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVersions(items);
    });

    return () => {
      unsubProjects();
      unsubVersions();
    };
  }, [user]);

  const createProject = async () => {
    if (!user || !newProjectName.trim()) return;
    try {
      const projectsRef = collection(db, "users", user.uid, "projects");
      await addDoc(projectsRef, {
        name: newProjectName,
        createdAt: serverTimestamp(),
      });
      setNewProjectName("");
      setIsCreatingProject(false);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `users/${user.uid}/projects`,
      );
    }
  };

  const handleFileChange = (newCode: string) => {
    setCode(newCode);
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFile ? { ...f, content: newCode } : f)),
    );
  };

  const switchFile = (name: string) => {
    const file = files.find((f) => f.name === name);
    if (file) {
      setActiveFile(name);
      setCode(file.content);
    }
  };

  const addNewFile = () => {
    const name = prompt("Enter file name (e.g. math_utils.c):");
    if (name && !files.find((f) => f.name === name)) {
      const newFiles = [...files, { name, content: "// New file: " + name }];
      setFiles(newFiles);
      setActiveFile(name);
      setCode("// New file: " + name);
    }
  };

  const deleteFile = (name: string) => {
    if (files.length <= 1) return;
    if (confirm(`Delete ${name}?`)) {
      const newFiles = files.filter((f) => f.name !== name);
      setFiles(newFiles);
      if (activeFile === name) {
        setActiveFile(newFiles[0].name);
        setCode(newFiles[0].content);
      }
    }
  };

  const renameFile = (oldName: string) => {
    const newName = prompt("Enter new name for " + oldName + ":", oldName);
    if (
      newName &&
      newName !== oldName &&
      !files.find((f) => f.name === newName)
    ) {
      setFiles((prev) =>
        prev.map((f) => (f.name === oldName ? { ...f, name: newName } : f)),
      );
      if (activeFile === oldName) {
        setActiveFile(newName);
      }
    }
  };

  // Debounced Linting
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;

    if (lintTimeoutRef.current) {
      clearTimeout(lintTimeoutRef.current);
    }

    lintTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.post("/api/compile", {
          code,
          config: linterConfig,
        });
        const { markers } = res.data;

        if (monacoRef.current && editorRef.current && markers) {
          monacoRef.current.editor.setModelMarkers(
            editorRef.current.getModel(),
            "owner",
            markers,
          );
          updateErrorDecorations(markers);
        }
      } catch (err) {
        console.error("Linting failed", err);
      }
    }, 3000); // 3s debounce

    return () => {
      if (lintTimeoutRef.current) clearTimeout(lintTimeoutRef.current);
    };
  }, [code]);

  
  const handleLogin = async () => {

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setExplanation(null);
    setIsDebugging(false);
    setDebugSteps([]);
    setCurrentStepIndex(-1);
    setOutput("Compiling...");
    try {
      const res = await axios.post("/api/compile", {
        code,
        shouldExplain: true,
        config: linterConfig,
        studentProfile: errorProfile.profileText, // ← adaptive ML layer
      });
      const {
        success,
        stdout,
        stderr,
        error,
        explanation: aiExpl,
        markers,
        debugSteps: aiSteps,
      } = res.data;

      let finalOutput = "";
      if (success) {
        finalOutput = stdout || "Program executed successfully with no output.";
        if (aiSteps && aiSteps.length > 0) {
          setDebugSteps(aiSteps);
        }
      } else {
        finalOutput = `Error:\n${stderr || error}`;
        if (aiExpl) {
          setExplanation(aiExpl);
          setShowAI(true);
        }
      }
      setOutput(finalOutput);

      // Explicitly set markers on compile too
      if (monacoRef.current && editorRef.current && markers) {
        monacoRef.current.editor.setModelMarkers(
          editorRef.current.getModel(),
          "owner",
          markers,
        );
        updateErrorDecorations(markers);

        // Auto-scroll to error
        if (!success && markers.length > 0) {
          editorRef.current.revealLineInCenter(markers[0].startLineNumber);
          editorRef.current.setPosition({ lineNumber: markers[0].startLineNumber, column: markers[0].startColumn });
        }
      }

      // Save to history if logged in
      if (user) {
        try {
          const historyRef = collection(db, "users", user.uid, "history");
          await addDoc(historyRef, {
            code,
            output: finalOutput,
            explanation: aiExpl || "",
            projectId: currentProjectId,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.CREATE,
            `users/${user.uid}/history`,
          );
        }
      }
    } catch (err: any) {
      const serverErrMsg = err.response?.data?.error;
      setOutput(`Error: ${serverErrMsg || err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleGenerateTests = async () => {
    if (!code || isCompiling) return;
    setIsCompiling(true);
    setShowAI(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Generate basic unit tests for this code." },
    ]);
    try {
      const res = await axios.post("/api/generate-tests", { code });
      const tests = res.data.tests;
      setMessages((prev) => [...prev, { role: "ai", content: tests }]);
    } catch (err: any) {
      console.error("Test generation failed", err);
      // setMessages((prev) => [...prev, { role: "ai", content: "Sorry, test generation failed." }]);
    } finally {
      setIsCompiling(false);
    }
  };

  const startDebugging = async () => {
    if (isCompiling) return;
    setIsDebugging(true);
    setCurrentStepIndex(0);
    // Move editor to first line of execution
    if (debugSteps.length > 0) {
      const step = debugSteps[0];
      editorRef.current.revealLineInCenter(step.line);
      updateDebugDecoration(step.line, step.variables);
    }
  };

  const stepBack = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      const currentStep = debugSteps[currentStepIndex];
      const prevStep = debugSteps[prevIdx];

      const changed = new Set<string>();
      // Watchpoint check (reverse)
      watchVars.forEach((v) => {
        if (currentStep.variables[v] !== prevStep.variables[v]) {
          setWatchLogs((prev) =>
            [
              `[Watch] ${v} changed: ${currentStep.variables[v]} -> ${prevStep.variables[v]}`,
              ...prev,
            ].slice(0, 50),
          );
          changed.add(v);

          // Check condition
          const cond = watchConditions[v];
          if (cond) {
            try {
              const val = prevStep.variables[v];
              // Safely evaluate condition like "x > 10"
              const result = new Function(v, `return ${cond}`)(val);
              if (result) {
                setWatchLogs((prev) =>
                  [
                    `[Alert] ${v} met condition: ${cond} (Value: ${val})`,
                    ...prev,
                  ].slice(0, 50),
                );
              }
            } catch (e) {}
          }
        }
      });
      setLastChangedVars(changed);

      setCurrentStepIndex(prevIdx);
      const step = debugSteps[prevIdx];
      editorRef.current.revealLineInCenter(step.line);
      updateDebugDecoration(step.line, step.variables);
      if (step.output) setOutput(step.output);
    }
  };

  const stepNext = () => {
    if (currentStepIndex < debugSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const currentStep = debugSteps[currentStepIndex];
      const nextStep = debugSteps[nextIdx];

      const changed = new Set<string>();
      // Watchpoint check
      watchVars.forEach((v) => {
        if (currentStep && currentStep.variables[v] !== nextStep.variables[v]) {
          setWatchLogs((prev) =>
            [
              `[Watch] ${v} changed: ${currentStep.variables[v]} -> ${nextStep.variables[v]}`,
              ...prev,
            ].slice(0, 50),
          );
          changed.add(v);

          // Check condition
          const cond = watchConditions[v];
          if (cond) {
            try {
              const val = nextStep.variables[v];
              const result = new Function(v, `return ${cond}`)(val);
              if (result) {
                setWatchLogs((prev) =>
                  [
                    `[Alert] ${v} met condition: ${cond} (Value: ${val})`,
                    ...prev,
                  ].slice(0, 50),
                );
              }
            } catch (e) {}
          }
        }
      });
      setLastChangedVars(changed);

      setCurrentStepIndex(nextIdx);
      const step = debugSteps[nextIdx];
      editorRef.current.revealLineInCenter(step.line);
      updateDebugDecoration(step.line, step.variables);
      // Update output if step has incremental output
      if (step.output) {
        setOutput(step.output);
      }
    } else {
      stopDebugging();
    }
  };

  const continueDebug = () => {
    let nextIdx = currentStepIndex + 1;
    while (nextIdx < debugSteps.length) {
      const step = debugSteps[nextIdx];
      // Check if line has a breakpoint
      if (breakpoints[step.line]) {
        const info = breakpoints[step.line];
        if (!info.condition) {
          // Hit standard breakpoint - stop here
          setCurrentStepIndex(nextIdx);
          const s = debugSteps[nextIdx];
          editorRef.current.revealLineInCenter(s.line);
          updateDebugDecoration(s.line, s.variables);
          if (s.output) setOutput(s.output);
          return;
        } else {
          // Check condition
          try {
            const context = { ...step.variables };
            const result = new Function(
              ...Object.keys(context),
              `return ${info.condition}`,
            )(...Object.values(context));
            if (result) {
              setCurrentStepIndex(nextIdx);
              const s = debugSteps[nextIdx];
              editorRef.current.revealLineInCenter(s.line);
              updateDebugDecoration(s.line, s.variables);
              if (s.output) setOutput(s.output);
              return;
            }
          } catch (e) {}
        }
      }
      nextIdx++;
    }
    // If no breakpoint hit, go to end
    if (debugSteps.length > 0) {
      const lastIdx = debugSteps.length - 1;
      setCurrentStepIndex(lastIdx);
      const s = debugSteps[lastIdx];
      editorRef.current.revealLineInCenter(s.line);
      updateDebugDecoration(s.line, s.variables);
      if (s.output) setOutput(s.output);
    }
  };

  const stopDebugging = () => {
    setIsDebugging(false);
    setCurrentStepIndex(-1);
    setLastChangedVars(new Set());
    if (editorRef.current) {
      const decorations = editorRef.current
        .getAllDecorations()
        .filter((d: any) => d.options.className === "debug-line-highlight");
      editorRef.current.deltaDecorations(
        decorations.map((d: any) => d.id),
        [],
      );
    }
  };

  const debugDecorationsRef = useRef<string[]>([]);
  const errorDecorationsRef = useRef<string[]>([]);

  const updateDebugDecoration = (line: number, variables: any = {}) => {
    if (!editorRef.current || !monacoRef.current) return;

    // Create inline value strings
    const allVars = { ...variables };
    // Include watched variables even if they aren't in current scope (emulator provides all)
    // but we prioritize what's in 'variables' (local scope)
    watchVars.forEach((v) => {
      if (
        allVars[v] === undefined &&
        debugSteps[currentStepIndex]?.variables[v] !== undefined
      ) {
        allVars[v] = debugSteps[currentStepIndex].variables[v];
      }
    });

    const varStrings = Object.entries(allVars)
      .map(([name, val]) => {
        const isChanged = lastChangedVars.has(name);
        return `${isChanged ? "🔥 " : ""}${name}: ${val}`;
      })
      .join(", ");

    const newDecorations: any[] = [
      {
        range: new monacoRef.current.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "debug-line-highlight",
          glyphMarginClassName: "debug-line-glyph",
        },
      },
    ];

    if (varStrings) {
      newDecorations.push({
        range: new monacoRef.current.Range(line, 1, line, 1000),
        options: {
          after: {
            content: `  // ${varStrings}`,
            inlineClassName: "debug-inline-vars",
          },
        },
      });
    }

    debugDecorationsRef.current = editorRef.current.deltaDecorations(
      debugDecorationsRef.current,
      newDecorations,
    );
  };

  const updateErrorDecorations = (markers: any[]) => {
    if (!editorRef.current || !monacoRef.current) return;

    const newDecorations = markers.map((m) => ({
      range: new monacoRef.current.Range(
        m.startLineNumber,
        1,
        m.startLineNumber,
        1,
      ),
      options: {
        glyphMarginClassName: "error-glyph-marker",
        glyphMarginHoverMessage: {
          value: `**AI Analysis Available**\nClick icon to explain: _${m.message}_`,
        },
        stickiness:
          monacoRef.current.editor.TrackedRangeStickiness
            .NeverGrowsWhenTypingAtEdges,
      },
    }));

    errorDecorationsRef.current = editorRef.current.deltaDecorations(
      errorDecorationsRef.current,
      newDecorations,
    );
  };

  const handleExplain = async (errorText: string): Promise<string | null> => {
    setIsExplaining(true);
    setExplanation(null);
    setShowAI(true);
    
    // Don't prefix with "Explain this error: " if it's already a general question
    const isQuestion = errorText.startsWith("Answer this question");
    const displayMessage = isQuestion ? errorText.replace("Answer this question contextually based on my current code: ", "") : `Explain this error: ${errorText}`;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: displayMessage },
    ]);
    try {
      const res = await axios.post("/api/explain", { error: errorText, code, history: messages });
      const result = res.data.explanation;
      setExplanation(result);
      setMessages((prev) => [...prev, { role: "ai", content: result }]);
      return result;
    } catch (err: any) {
      const errorMsg =
        "Sorry, I couldn't explain that error. Please try again.";
      setExplanation(errorMsg);
      setMessages((prev) => [...prev, { role: "ai", content: errorMsg }]);
      return null;
    } finally {
      setIsExplaining(false);
    }
  };

  const [aiQuery, setAiQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Formatting
  const [isFormatting, setIsFormatting] = useState(false);
  const handleFormat = async () => {
    if (!code || isFormatting) return;
    setIsFormatting(true);
    try {
      const res = await axios.post("/api/format", { code });
      if (res.data.formattedCode) {
        setCode(res.data.formattedCode);
      }
    } catch (err) {
      console.error("Format failed", err);
    } finally {
      setIsFormatting(false);
    }
  };

  // Snippets
  // Linter Config
  const [linterConfig, setLinterConfig] = useState({
    showWarnings: true,
    strictMode: false,
    indentSize: 4,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>('dark');

  // Versioning
  const saveVersion = async () => {
    if (!user) {
      alert("Please sign in to save versions.");
      return;
    }
    setIsSavingVersion(true);
    try {
      const versionsRef = collection(db, "users", user.uid, "versions");
      await addDoc(versionsRef, {
        code,
        activeFile,
        projectId: currentProjectId,
        createdAt: serverTimestamp(),
      });
      alert("Version saved!");
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `users/${user.uid}/versions`,
      );
    } finally {
      setIsSavingVersion(false);
    }
  };

  const historyFiltered = history.filter((item) => {
    const now = new Date();
    const isToday = (d: any) =>
      d && d.toDate().toDateString() === now.toDateString();
    const isThisWeek = (d: any) =>
      d && now.getTime() - d.toDate().getTime() < 7 * 24 * 60 * 60 * 1000;

    const matchSearch =
      item.code.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.output.toLowerCase().includes(historySearch.toLowerCase());
    const matchProject =
      !item.projectId ||
      item.projectId === currentProjectId ||
      currentProjectId === "default";

    let matchDate = true;
    if (historyFilter === "today") matchDate = isToday(item.createdAt);
    if (historyFilter === "week") matchDate = isThisWeek(item.createdAt);

    return matchSearch && matchProject && matchDate;
  });

  const handleManualQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAsking) return;

    const originalQuery = aiQuery;
    setIsAsking(true);
    setShowAI(true);
    setMessages((prev) => [...prev, { role: "user", content: originalQuery }]);
    setAiQuery("");

    try {
      const res = await axios.post("/api/explain", {
        error: `User Question: ${originalQuery}\n\nPrevious context: ${explanation || ""}`,
        code,
      });
      const result = res.data.explanation;
      setExplanation(result);
      setMessages((prev) => [...prev, { role: "ai", content: result }]);
    } catch (err: any) {
      const errorMsg = "Sorry, I couldn't answer that. Please try again.";
      setMessages((prev) => [...prev, { role: "ai", content: errorMsg }]);
    } finally {
      setIsAsking(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (!explanation) return;
    // Attempt to extract code block from markdown
    const codeBlockMatch = explanation.match(/```(?:c|cpp)?\n([\s\S]*?)```/);
    const textToCopy = codeBlockMatch ? codeBlockMatch[1] : explanation;
    navigator.clipboard.writeText(textToCopy);
    alert("Copied to clipboard!");
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger("keyboard", "undo", null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger("keyboard", "redo", null);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setCode(item.code);
    setOutput(item.output);
    if (item.explanation) {
      setExplanation(item.explanation);
      setShowAI(true);
    } else {
      setExplanation(null);
    }
  };

  const loadLesson = (lessonCode: string) => {
    if (confirm("This will replace your current code. Continue?")) {
      setCode(lessonCode);
      setOutput("Lesson loaded. Click Compile & Run to test it!");
      setExplanation(null);
    }
  };

  const clearConsole = () => setOutput("Console cleared.");

  const SidebarContent = () => (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Project Selector */}
      <div className="p-4 pt-4">
        <div className="flex items-center justify-between opacity-50 text-[10px] mb-3 uppercase font-bold tracking-widest text-gray-300">
          <span>PROJECT</span>
          <button
            onClick={() => setIsCreatingProject(!isCreatingProject)}
            className="hover:text-blue-400 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {isCreatingProject ? (
          <div className="flex gap-1 mb-2">
            <input
              type="text"
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createProject()}
              placeholder="New project..."
              className="flex-1 bg-[#1e1e1e] border border-[#333333] rounded text-[11px] px-2 py-1 h-8 focus:outline-none focus:border-blue-500 text-gray-200"
            />
            <button
              onClick={createProject}
              className="bg-blue-600 text-white px-2 rounded hover:bg-blue-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative group">
            <select
              value={currentProjectId}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#333333] rounded text-[11px] px-3 py-1.5 h-9 focus:outline-none focus:border-blue-500 text-gray-200 appearance-none cursor-pointer pr-8 font-medium"
            >
              <option value="default">Default Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none opacity-30 group-hover:opacity-60">
              <ChevronRight className="w-3 h-3 rotate-90" />
            </div>
          </div>
        )}
      </div>

      <div data-tour="sidebar-explorer" className="px-4 py-2 mt-2 text-[10px] uppercase tracking-widest font-bold opacity-50 text-gray-300 flex items-center justify-between">
        <span>EXPLORER</span>
        <button onClick={addNewFile} className="hover:text-blue-400">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Multi-Files Section */}
      <motion.div variants={STAGGER} initial="hidden" animate="visible" className="mb-4 max-h-48 overflow-y-auto mt-1">
        {files.map((file, i) => (
          <motion.div
            key={file.name}
            variants={{
              hidden: { opacity: 0, x: -10 },
              visible: { opacity: 1, x: 0 },
            }}
            transition={{ ...EASE_OUT, delay: i * 0.03 }}
            onClick={() => switchFile(file.name)}
            className={`flex items-center px-4 py-2 cursor-pointer text-xs group relative transition-colors ${activeFile === file.name ? "bg-[#37373D] text-white shadow-inner font-bold" : "hover:bg-[#2A2D2E]/50 text-gray-400"}`}
          >
            {activeFile === file.name && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
            )}
            <span className="mr-2 text-orange-400 font-bold font-mono text-xs">
              C
            </span>
            <span className="flex-1 truncate">{file.name}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  renameFile(file.name);
                }}
                className="p-1 hover:text-blue-400 transition-colors"
                title="Rename"
              >
                <RefreshCw className="w-2.5 h-2.5 translate-y-[1px]" />
              </button>
              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.name);
                  }}
                  className="p-1 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Dynamic Sidebar Content: History vs Versions */}
      <div className="flex-1 flex flex-col overflow-hidden border-t border-[#333333]">
        <div className="p-2 flex gap-1">
          <button
            data-tour="sidebar-history"
            onClick={() => setSidebarTab("history")}
            className={`flex-1 text-[11px] uppercase font-bold tracking-widest py-2 rounded transition-all ${sidebarTab === "history" ? "bg-[#333333] text-white shadow-lg" : "opacity-40 hover:opacity-100"}`}
          >
            HISTORY
          </button>
          <button
            onClick={() => setSidebarTab("versions")}
            className={`flex-1 text-[11px] uppercase font-bold tracking-widest py-2 rounded transition-all ${sidebarTab === "versions" ? "bg-[#333333] text-white shadow-lg" : "opacity-40 hover:opacity-100"}`}
          >
            VERSIONS
          </button>
        </div>

        <div className="px-2 py-2 flex gap-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder={`Search ${sidebarTab}...`}
              className="w-full bg-[#1A1A1C] border border-[#333333] rounded text-[10px] p-2 pl-7 focus:outline-none focus:border-blue-500 text-gray-400"
            />
            <Search className="w-3 h-3 absolute left-2 top-2.5 opacity-20" />
          </div>
          <select
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value as any)}
            className="bg-[#1A1A1C] border border-[#333333] rounded text-[9px] pl-2 pr-5 focus:outline-none text-gray-400 appearance-none cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg viewBox=%220 0 24 24%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%2M6 9l6 6 6-6%22 stroke=%22%238b949e%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-no-repeat bg-[position:right_4px_center] bg-[length:12px_12px] hover:border-[#555] transition-colors"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">Week</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {!user ? (
            <div className="p-6 text-center opacity-30">
              <p className="text-[10px] uppercase leading-relaxed font-bold mb-2">
                Sign in to sync
              </p>
              <motion.button
                onClick={handleLogin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING}
                className="text-blue-400 text-[10px] font-bold border border-blue-400 px-3 py-1 rounded hover:bg-blue-400 hover:text-white transition-all"
              >
                Sign In
              </motion.button>
            </div>
          ) : isLoadingHistory ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin opacity-40" />
            </div>
          ) : sidebarTab === "history" ? (
            <motion.div variants={STAGGER} initial="hidden" animate="visible" className="flex flex-col gap-0.5">
              {historyFiltered.map((item, i) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ ...EASE_OUT, delay: i * 0.03 }}
                  onClick={() => loadFromHistory(item)}
                  className="px-3 py-1.5 text-xs hover:bg-[#2A2D2E] rounded cursor-pointer group flex items-center justify-between opacity-80 hover:opacity-100 transition-all border border-transparent hover:border-white/5"
                >
                  <div className="flex flex-col truncate">
                    <span className="truncate w-32 tracking-tight">
                      {" "}
                      {item.code.split("\n")[0].substring(0, 20)}...
                    </span>
                    <span className="text-[8px] opacity-30 uppercase">
                      {" "}
                      {item.createdAt
                        ?.toDate()
                        .toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                      ·{" "}
                      {item.createdAt
                        ?.toDate()
                        .toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </span>
                  </div>
                </motion.div>
              ))}
              {history.length === 0 && (
                <div className="text-center p-4 opacity-20 text-[10px] italic">
                  No history items found
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div variants={STAGGER} initial="hidden" animate="visible" className="flex flex-col gap-0.5">
              {versions
                .filter(
                  (v) =>
                    (v.activeFile
                      .toLowerCase()
                      .includes(historySearch.toLowerCase()) ||
                      v.code
                        .toLowerCase()
                        .includes(historySearch.toLowerCase())) &&
                    (!v.projectId ||
                      v.projectId === currentProjectId ||
                      currentProjectId === "default"),
                )
                .map((v, i) => (
                  <motion.div
                    key={v.id}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ ...EASE_OUT, delay: i * 0.03 }}
                    onClick={() => {
                      if (
                        confirm(
                          "Revert to this version? Current code will be lost.",
                        )
                      ) {
                        setCode(v.code);
                        setActiveFile(v.activeFile);
                        alert(
                          "Reverted to version from " +
                            v.createdAt?.toDate().toLocaleTimeString(),
                        );
                      }
                    }}
                    className="px-3 py-2 text-xs hover:bg-[#2A2D2E] rounded cursor-pointer group flex items-center justify-between opacity-80 hover:opacity-100 transition-all border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3 text-blue-500" />
                      <div className="flex flex-col">
                        <span className="font-bold text-[10px]">
                          {v.activeFile}
                        </span>
                        <span className="text-[8px] opacity-30">
                          Snapshot ·{" "}
                          {v.createdAt?.toDate().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              {versions.length === 0 && (
                <div className="text-center p-6 opacity-20 text-[10px] flex flex-col items-center gap-2">
                  <Save className="w-6 h-6 opacity-40" />
                  <span>No saved versions yet</span>
                  <motion.button
                    onClick={saveVersion}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={SPRING}
                    className="mt-2 text-blue-400 text-[10px] font-bold hover:underline"
                  >
                    Save Current Snapshot
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Learning Center */}
      <div data-tour="learning-center" className="mt-auto border-t border-[#1A1A1A] bg-[#1e1e1e] p-3 max-h-64 overflow-y-auto flex flex-col gap-2">
        <div className="flex items-center justify-between opacity-50 text-[9px] uppercase font-bold tracking-widest">
          <span>Learning Center</span>
        </div>
        <select
          onChange={(e) => {
            const topic = e.target.value;
            // Provide boilerplate based on topic
            let boilerplate = "";
            let explanation = "";
            switch (topic) {
              case "Variables":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    int myAge = 25;\n    printf("Age: %d\\n", myAge);\n    return 0;\n}';
                explanation = "Variables are like containers for storing data values. In C, you must specify the type (e.g., int, float, char) before the variable name.";
                break;
              case "Data Types":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    int i = 10;\n    float f = 3.14;\n    char c = \'A\';\n    printf("Int: %d, Float: %f, Char: %c\\n", i, f, c);\n    return 0;\n}';
                explanation = "C has several basic data types: int (integers), float (floating-point numbers), double (double precision floating-point), and char (single characters).";
                break;
              case "printf()":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    int score = 100;\n    printf("Score: %d\\n", score);\n    return 0;\n}';
                explanation = "printf() is used to output text and variables to the console. You use format specifiers like %d for integers and %f for floats.";
                break;
              case "scanf()":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    int number;\n    printf("Enter a number: ");\n    scanf("%d", &number);\n    printf("You entered: %d\\n", number);\n    return 0;\n}';
                explanation = "scanf() takes input from the user. Don't forget the & (address-of) operator before the variable name when scanning!";
                break;
              case "Loops":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    for (int i = 0; i < 5; i++) {\n        printf("Iteration %d\\n", i);\n    }\n    return 0;\n}';
                explanation = "Loops let you run the same block of code multiple times. Common loops are 'for', 'while', and 'do-while'.";
                break;
              case "Conditions":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    int age = 18;\n    if (age >= 18) {\n        printf("Adult\\n");\n    } else {\n        printf("Minor\\n");\n    }\n    return 0;\n}';
                explanation = "Conditions (if, else if, else) execute different blocks of code depending on whether a statement evaluates to true or false.";
                break;
              case "Operators":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    int sum = 10 + 5;\n    int remainder = 10 % 3;\n    printf("Sum: %d, Remainder: %d\\n", sum, remainder);\n    return 0;\n}';
                explanation = "Operators perform operations on variables and values. Common ones include +, -, *, /, and % (modulo).";
                break;
              case "Arrays":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    int numbers[] = {10, 20, 30};\n    printf("First element: %d\\n", numbers[0]);\n    return 0;\n}';
                explanation = "Arrays store multiple values of the same type in a single variable. They are zero-indexed, meaning the first element is at index 0.";
                break;
              case "Functions":
                boilerplate = '#include <stdio.h>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    printf("Sum: %d\\n", add(5, 7));\n    return 0;\n}';
                explanation = "Functions are blocks of code that run only when called. They help organize code and make it reusable.";
                break;
              case "Pointers":
                boilerplate = '#include <stdio.h>\n\nint main() {\n    int myVar = 10;\n    int *myPtr = &myVar;\n    printf("Value: %d, Address: %p\\n", myVar, (void*)myPtr);\n    return 0;\n}';
                explanation = "Pointers are variables that store the memory address of another variable. They are powerful but can be tricky!";
                break;
            }
            if (boilerplate) {
              setMessages(prev => [...prev, { role: "ai", content: `**Learning: ${topic}**\n\n${explanation}\n\nHere is an example:\n\n\`\`\`c\n${boilerplate}\n\`\`\`\n\nYou can insert this snippet into your editor using the button on the top right of the code block, or I can load it for you.` }]);
              loadLesson(boilerplate);
              setShowAI(true);
            }
          }}
          className="w-full bg-[#1e1e1e] border border-[#333333] rounded text-[10px] px-2 py-1.5 focus:outline-none focus:border-blue-500 text-gray-200"
        >
          <option value="">Select a topic...</option>
          <option value="Variables">Variables</option>
          <option value="Data Types">Data Types</option>
          <option value="printf()">printf()</option>
          <option value="scanf()">scanf()</option>
          <option value="Loops">Loops</option>
          <option value="Conditions">Conditions</option>
          <option value="Operators">Operators</option>
          <option value="Arrays">Arrays</option>
          <option value="Functions">Functions</option>
          <option value="Pointers">Pointers</option>
        </select>
        <span className="text-[9px] opacity-40 italic">Select a topic to load a code example and get AI guidance.</span>
      </div>
    </div>
  );

  const TourOverlay = () => {
    if (!isTourVisible || tourStep < 0) return null;

    const step = TOUR_STEPS[tourStep];
    const rect = tourTargetRect;
    const padding = 8;

    // Spotlight rect with padding
    const spotlight = rect
      ? {
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }
      : null;

    // Calculate tooltip position based on step.position and spotlight
    const getTooltipStyle = (): React.CSSProperties => {
      if (!spotlight) {
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      }
      const tooltipWidth = 300;
      const tooltipMargin = 16;

      switch (step.position) {
        case 'bottom':
          return {
            top: spotlight.top + spotlight.height + tooltipMargin,
            left: Math.max(8, Math.min(window.innerWidth - tooltipWidth - 8,
              spotlight.left + spotlight.width / 2 - tooltipWidth / 2)),
            width: tooltipWidth,
          };
        case 'top':
          return {
            bottom: window.innerHeight - spotlight.top + tooltipMargin,
            left: Math.max(8, Math.min(window.innerWidth - tooltipWidth - 8,
              spotlight.left + spotlight.width / 2 - tooltipWidth / 2)),
            width: tooltipWidth,
          };
        case 'right':
          return {
            top: Math.max(8, spotlight.top + spotlight.height / 2 - 80),
            left: spotlight.left + spotlight.width + tooltipMargin,
            width: tooltipWidth,
          };
        case 'left':
          return {
            top: Math.max(8, spotlight.top + spotlight.height / 2 - 80),
            right: window.innerWidth - spotlight.left + tooltipMargin,
            width: tooltipWidth,
          };
        default:
          return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      }
    };

    return (
      <AnimatePresence>
        {isTourVisible && (
          <>
            {/* Dark overlay — covers entire screen */}
            <motion.div
              key="tour-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9000,
                pointerEvents: 'none',
              }}
            >
              {/* SVG mask creates the spotlight cutout */}
              {spotlight && (
                <svg
                  width="100%"
                  height="100%"
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <defs>
                    <mask id="spotlight-mask">
                      {/* White = visible (dark overlay shows) */}
                      <rect width="100%" height="100%" fill="white" />
                      {/* Black = invisible (spotlight cutout) */}
                      <rect
                        x={spotlight.left}
                        y={spotlight.top}
                        width={spotlight.width}
                        height={spotlight.height}
                        rx={6}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.72)"
                    mask="url(#spotlight-mask)"
                  />
                </svg>
              )}

              {/* Spotlight border ring — animated pulse */}
              {spotlight && (
                <motion.div
                  key={`ring-${tourStep}`}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                  style={{
                    position: 'absolute',
                    top: spotlight.top,
                    left: spotlight.left,
                    width: spotlight.width,
                    height: spotlight.height,
                    border: '2px solid #1f6feb',
                    borderRadius: 8,
                    boxShadow: '0 0 0 4px rgba(31, 111, 235, 0.2)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </motion.div>

            {/* Tooltip card — above the overlay (pointer events on) */}
            <motion.div
              key={`tooltip-${tourStep}`}
              initial={{ opacity: 0, y: step.position === 'bottom' ? -8 : 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              style={{
                position: 'fixed',
                zIndex: 9001,
                ...getTooltipStyle(),
                background: '#1c2128',
                border: '1px solid #30363d',
                borderRadius: 10,
                padding: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                pointerEvents: 'all',
              }}
            >
              {/* Step counter */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 11, color: '#6e7681' }}>
                  Step {tourStep + 1} of {TOUR_STEPS.length}
                </span>
                <button
                  onClick={endTour}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6e7681',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '0 2px',
                  }}
                  title="Skip tour"
                >
                  ×
                </button>
              </div>

              {/* Progress bar */}
              <div style={{
                height: 3,
                background: '#21262d',
                borderRadius: 2,
                marginBottom: 12,
                overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: `${(tourStep / TOUR_STEPS.length) * 100}%` }}
                  animate={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '100%', background: '#1f6feb', borderRadius: 2 }}
                />
              </div>

              {/* Title */}
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#e6edf3',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>{step.icon}</span>
                <span>{step.title}</span>
              </div>

              {/* Description */}
              <p style={{
                fontSize: 12,
                color: '#8b949e',
                lineHeight: 1.65,
                margin: 0,
                marginBottom: 14,
              }}>
                {step.description}
              </p>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {tourStep > 0 && (
                  <button
                    onClick={() => goToStep(tourStep - 1)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #30363d',
                      borderRadius: 6,
                      color: '#8b949e',
                      fontSize: 12,
                      padding: '5px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => endTour()}
                  style={{
                    background: 'transparent',
                    border: '1px solid #30363d',
                    borderRadius: 6,
                    color: '#6e7681',
                    fontSize: 12,
                    padding: '5px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    if (tourStep === TOUR_STEPS.length - 1) {
                      endTour();
                    } else {
                      goToStep(tourStep + 1);
                    }
                  }}
                  style={{
                    background: '#1f6feb',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '5px 14px',
                    cursor: 'pointer',
                  }}
                >
                  {tourStep === TOUR_STEPS.length - 1 ? '🎉 Finish' : 'Next →'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '40px 1fr 24px', // topbar | tabbar | content | statusbar
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0f1117',
      color: '#e6edf3',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 13,
      filter: appTheme === 'light' ? 'invert(1) hue-rotate(180deg)' : 'none',
      transition: 'filter 0.3s ease',
    }}>
      {/* Snippets modal — render at root level, outside all panels */}
      <AnimatePresence>
      {showSnippets && (
        <motion.div
           key="snippets-overlay"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.15 }}
           className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
        >
          {/* Backdrop */}
          <div
            onClick={() => setShowSnippets(false)}
            style={{
              position: 'absolute', inset: 0,
            }}
          />

          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={EASE_OUT}
            style={{
            position: 'relative',
            width: 640, maxWidth: '90vw',
            maxHeight: '75vh',
            background: '#1a1d23',
            border: '1px solid #2d3139',
            borderRadius: 10,
            zIndex: 101,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>

            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #2d3139',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Code Snippets</span>
              <button onClick={() => setShowSnippets(false)} style={{
                background: 'transparent', border: 'none', color: '#8b949e',
                cursor: 'pointer', fontSize: 18, lineHeight: 1,
              }}>×</button>
            </div>

            {/* Scrollable content */}
            <div style={{ overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {SNIPPETS.map(group => (
                <div key={group.category}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: '#6e7681',
                    letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    {group.category}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {group.items.map(s => (
                      <div
                        key={s.title}
                        onClick={() => {
                          // Insert snippet at cursor in Monaco
                          if (editorRef.current) {
                            const selection = editorRef.current.getSelection();
                            editorRef.current.executeEdits('snippet', [{
                              range: selection,
                              text: s.code,
                            }]);
                            editorRef.current.focus();
                          }
                          setShowSnippets(false);
                        }}
                        style={{
                          background: '#12151c',
                          border: '1px solid #2d3139',
                          borderRadius: 6,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'border-color 150ms',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#58a6ff')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2d3139')}
                      >
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#e6edf3', marginBottom: 4 }}>
                          {s.title}
                        </div>
                        <pre style={{
                          fontSize: 10, color: '#8b949e',
                          fontFamily: 'monospace', margin: 0,
                          overflow: 'hidden', maxHeight: 40,
                          textOverflow: 'ellipsis', whiteSpace: 'pre-wrap',
                        }}>
                          {s.code.split('\n').slice(0, 2).join('\n')}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Top Navigation / Header */}
      
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
          <motion.button 
            data-tour="toolbar-compile"
            onClick={handleCompile}
            disabled={isCompiling}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING}
            style={{ flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', padding: '4px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 4, cursor: isCompiling ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 'bold' }}
          >
            {isCompiling ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                style={{ display: 'inline-flex', marginRight: 8 }}
              >
                <Loader2 className="w-3.5 h-3.5" />
              </motion.span>
            ) : (
              <Play className="w-3 h-3 fill-current mr-2" />
            )}
            {isCompiling ? 'Compiling...' : 'Compile & Run'}
          </motion.button>

          {/* Toolbar buttons — hide text labels when isCompact, hide button when isNarrow */}
          {!isNarrow && (
            <>
              <ToolbarBtn icon={<RefreshCw size={13} className={isFormatting ? "animate-spin" : ""} />} label={isCompact ? '' : 'FORMAT'} onClick={handleFormat} />
              <ToolbarBtn icon={<TestTube size={13} />} label={isCompact ? '' : 'GENERATE TESTS'} onClick={handleGenerateTests} />
              <ToolbarBtn icon={<Save size={13} className={isSavingVersion ? "animate-pulse" : ""} />} label={isCompact ? '' : 'SAVE SNAPSHOT'} onClick={saveVersion} />
              {!isCompact && <ToolbarBtn data-tour="toolbar-snippets" icon={<Sparkles size={13} />} label="SNIPPETS" onClick={() => setShowSnippets(!showSnippets)} />}
              {!isCompact && <ToolbarBtn icon={<Layers size={13} />} label="LINTER" onClick={() => setShowSettings(!showSettings)} />}
              {codeSelection.trim().length > 0 && !isCompact && (
                <ToolbarBtn
                   icon={<Sparkles size={13} className="text-yellow-400" />}
                   label="EXPLAIN SELECTION"
                   onClick={() => handleExplain(`Explain this selected code in detail:\n\n\`\`\`c\n${codeSelection}\n\`\`\``)}
                />
              )}
              <ToolbarBtn
                icon={appTheme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                label={isCompact ? '' : (appTheme === 'dark' ? 'LIGHT' : 'DARK')}
                onClick={() => setAppTheme(t => t === 'dark' ? 'light' : 'dark')}
              />
            </>
          )}
        </div>

        {/* Right — never shrink */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            data-tour="help-button"
            onClick={startTour}
            title="Start tour"
            style={{
              background: 'transparent',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#8b949e',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <HelpCircle size={13} />
            {!isCompact && <span>Tour</span>}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-5 h-5 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                    style={{ filter: appTheme === 'light' ? 'invert(1) hue-rotate(180deg)' : 'none' }}
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="text-[10px] font-bold opacity-70 hidden sm:inline uppercase tracking-wider">
                  {user.displayName || "Student"}
                </span>
              </div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING}
                className="opacity-50 hover:opacity-100 transition-all p-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={handleLogin}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              className="text-[10px] font-bold uppercase tracking-widest bg-white bg-opacity-5 hover:bg-opacity-10 px-3 py-1 rounded border border-white border-opacity-10 transition-all font-mono"
            >
              Sign In
            </motion.button>
          )}
        </div>
      </header>


      
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        minHeight: 0,          // critical: prevents grid row from expanding
        width: '100%',
      }}>

        {/* ── LEFT SIDEBAR ─────────────────────────── */}
        <motion.aside
          animate={{
            width: panels.sidebar ? sidebarWidth : 0,
            minWidth: panels.sidebar ? sidebarWidth : 0,
          }}
          transition={EASE_IN_OUT}
          style={{
            flexShrink: 0,
            overflow: 'hidden',
            background: '#1a1d23',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SidebarContent />
        </motion.aside>

        {/* Sidebar drag handle */}
        {panels.sidebar && (
          <div
            onMouseDown={useDrag(delta => {
              setSidebarWidth(w => Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w + delta)));
            })}
            style={{
              width: 4, flexShrink: 0, cursor: 'col-resize',
              background: 'transparent',
              borderRight: '1px solid #2d3139',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1f6feb')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          />
        )}

        {/* ── CENTER COLUMN ────────────────────────── */}
        <div style={{
          flex: '1 1 0',   // takes all remaining space
          minWidth: 0,     // critical: allows Monaco to shrink
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Editor — fills available height */}
          <div data-tour="monaco-editor" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="flex bg-[#252526] h-9 border-b border-[#1A1A1A] items-center justify-between pr-4">
                      <div className="flex h-full">
                        <div className="px-4 flex items-center bg-[#1E1E1E] border-t border-t-blue-500 text-[11px] text-white">
                          {activeFile}{" "}
                          <span className="ml-3 opacity-30 hover:opacity-100 cursor-pointer">
                            ×
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-[#1e1e1e] rounded p-0.5 border border-[#333333]">
                          <button
                            onClick={handleUndo}
                            title="Undo (Ctrl+Z)"
                            className="p-1 hover:bg-white/5 opacity-60 hover:opacity-100 transition-all rounded"
                          >
                            <RefreshCw className="w-3.5 h-3.5 -scale-x-100" />
                          </button>
                          <button
                            onClick={handleRedo}
                            title="Redo (Ctrl+Y)"
                            className="p-1 hover:bg-white/5 opacity-60 hover:opacity-100 transition-all rounded"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {debugSteps.length > 0 && !isDebugging && (
                            <button
                              data-tour="toolbar-debug"
                              onClick={startDebugging}
                              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[9px] font-bold uppercase rounded border border-blue-500/30 transition-all"
                            >
                              Start Debugging
                            </button>
                          )}
                          {isDebugging && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={stepBack}
                                disabled={currentStepIndex <= 0}
                                className="p-1 px-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[9px] font-bold uppercase rounded border border-blue-500/30 transition-all flex items-center gap-1 disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                Back
                              </button>
                              <button
                                onClick={stepNext}
                                className="p-1 px-3 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-[9px] font-bold uppercase rounded border border-green-500/30 transition-all flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" /> Step
                              </button>
                              <button
                                onClick={continueDebug}
                                className="p-1 px-3 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 text-[9px] font-bold uppercase rounded border border-yellow-500/30 transition-all flex items-center gap-1"
                              >
                                <ChevronRight className="w-3 h-3" /> Continue
                              </button>
                              <button
                                onClick={stopDebugging}
                                className="p-1 px-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-[9px] font-bold uppercase rounded border border-red-500/30 transition-all"
                              >
                                Stop
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
            <div className="flex-1 relative overflow-hidden">
                      <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          key="settings-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
                        >
                          <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 8 }}
                            transition={EASE_OUT}
                            className="w-full max-w-md bg-[#252526] border border-[#333333] rounded-lg shadow-2xl p-6"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
                                <Layers className="w-4 h-4" />
                                Linter & Environment Configuration
                              </div>
                              <button
                                onClick={() => setShowSettings(false)}
                                className="opacity-50 hover:opacity-100"
                              >
                                ×
                              </button>
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">
                                  Appearance
                                </label>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                  <div
                                    className="flex items-center justify-between bg-[#1e1e1e] p-3 rounded border border-[#333333] cursor-pointer hover:border-[#555] transition-colors"
                                    onClick={() =>
                                      setLinterConfig({
                                        ...linterConfig,
                                        showWarnings: !linterConfig.showWarnings,
                                      })
                                    }
                                  >
                                    <span className="text-[11px] select-none">Show Warnings</span>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${linterConfig.showWarnings ? 'bg-blue-500' : 'bg-[#333]'}`}>
                                      <motion.div animate={{ x: linterConfig.showWarnings ? 16 : 2 }} transition={SPRING} className="w-3 h-3 bg-white rounded-full absolute top-[2px]" />
                                    </div>
                                  </div>
                                  <div
                                    className="flex items-center justify-between bg-[#1e1e1e] p-3 rounded border border-[#333333] cursor-pointer hover:border-[#555] transition-colors"
                                    onClick={() =>
                                      setLinterConfig({
                                        ...linterConfig,
                                        strictMode: !linterConfig.strictMode,
                                      })
                                    }
                                  >
                                    <span className="text-[11px] select-none">Strict Analysis</span>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${linterConfig.strictMode ? 'bg-blue-500' : 'bg-[#333]'}`}>
                                      <motion.div animate={{ x: linterConfig.strictMode ? 16 : 2 }} transition={SPRING} className="w-3 h-3 bg-white rounded-full absolute top-[2px]" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">
                                  Formatting
                                </label>
                                <div className="bg-[#1e1e1e] p-3 rounded border border-[#333333] flex items-center justify-between mt-2">
                                  <span className="text-[11px]">
                                    Indent Size (Spaces)
                                  </span>
                                  <div className="relative">
                                    <select
                                      value={linterConfig.indentSize}
                                      onChange={(e) =>
                                        setLinterConfig({
                                          ...linterConfig,
                                          indentSize: Number(e.target.value),
                                        })
                                      }
                                      className="bg-[#252526] border border-[#333333] rounded text-[11px] py-1 pl-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 hover:border-[#555] transition-colors"
                                    >
                                      <option value={2}>2</option>
                                      <option value={4}>4</option>
                                      <option value={8}>8</option>
                                    </select>
                                    <ChevronRight className="w-3 h-3 absolute right-2.5 top-2 opacity-50 rotate-90 pointer-events-none" />
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-[#333333] flex justify-end gap-3">
                                <button
                                  onClick={() => setShowSettings(false)}
                                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded uppercase tracking-widest shadow-lg"
                                >
                                  Save Configuration
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                      </AnimatePresence>

                      <div style={{ height: '100%', filter: appTheme === 'light' ? 'invert(1) hue-rotate(180deg)' : 'none' }}>
                        <Editor
                          height="100%"
                          defaultLanguage="c"
                          theme={appTheme === 'dark' ? "vs-dark" : "vs-light"}
                          value={code}
                          options={{
                          automaticLayout: true,
                          fontSize: 13,
                          fontFamily: "var(--font-mono)",
                          suggestOnTriggerCharacters: true,
                          quickSuggestions: { other: true, comments: false, strings: false },
                          acceptSuggestionOnEnter: 'on',
                          tabCompletion: 'on',
                          wordBasedSuggestions: 'off',
                          suggest: { showSnippets: true, showFunctions: true, showKeywords: true },
                          parameterHints: { enabled: true, cycle: true },
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          scrollbar: {
                            vertical: "visible",
                            horizontal: "visible",
                            useShadows: false,
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10,
                          },
                          lineNumbers: "on",
                          padding: { top: 12 },
                          renderLineHighlight: "all",
                          cursorStyle: "line",
                          glyphMargin: true,
                          folding: true,
                          lineDecorationsWidth: 10,
                          lineNumbersMinChars: 3,
                        }}
                        onMount={(editor, monaco) => {
                          editorRef.current = editor;
                          monacoRef.current = monaco;

                          // Keybinding for Formatting (Cmd/Ctrl + Shift + F)
                          editor.addCommand(
                            monaco.KeyMod.CtrlCmd |
                              monaco.KeyMod.Shift |
                              monaco.KeyCode.KeyF,
                            () => {
                              handleFormat();
                            },
                          );

                          // Keybinding for Compile & Run (Cmd/Ctrl + Enter)
                          editor.addCommand(
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                            () => {
                              handleCompile();
                            },
                          );

                          // Keybinding for Save Snapshot (Cmd/Ctrl + S)
                          editor.addCommand(
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                            () => {
                              saveVersion();
                            },
                          );

                          // Keybinding for AI Panel Toggle (Cmd/Ctrl + B)
                          editor.addCommand(
                            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB,
                            () => {
                              setShowAI(!showAI);
                            },
                          );

                          if (!(window as any).monaco_c_setup_done) {
                            (window as any).monaco_c_setup_done = true;

                            monaco.languages.registerCompletionItemProvider('c', {
                              triggerCharacters: ['.', '>', ':'],
                              provideCompletionItems: (model, position) => {
                                const word = model.getWordUntilPosition(position);
                                const range = {
                                  startLineNumber: position.lineNumber,
                                  endLineNumber: position.lineNumber,
                                  startColumn: word.startColumn,
                                  endColumn: word.endColumn,
                                };

                                const suggestions = [
                                  // Common C Keywords
                                  { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'int ', range },
                                  { label: 'char', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'char ', range },
                                  { label: 'float', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'float ', range },
                                  { label: 'double', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'double ', range },
                                  { label: 'void', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'void ', range },
                                  { label: 'struct', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'struct ', range },
                                  { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ', range },
                                  // Stdlib functions
                                  {
                                    label: 'printf',
                                    kind: monaco.languages.CompletionItemKind.Function,
                                    insertText: 'printf("${1:format}\\n", ${2:args});',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Prints formatted output to stdout.',
                                    range
                                  },
                                  {
                                    label: 'scanf',
                                    kind: monaco.languages.CompletionItemKind.Function,
                                    insertText: 'scanf("${1:%d}", &${2:var});',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Reads formatted input from stdin.',
                                    range
                                  },
                                  {
                                    label: 'malloc',
                                    kind: monaco.languages.CompletionItemKind.Function,
                                    insertText: 'malloc(${1:size});',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    range
                                  },
                                  ...SNIPPETS.flatMap(g => g.items.map(i => ({
                                    label: i.title.toLowerCase().replace(/ /g, '_'),
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: i.code,
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: `Snippet: ${i.title}`,
                                    range
                                  })))
                                ];

                                // Add session variables if debugging
                                if (debugSteps.length > 0) {
                                  const allVars = new Set<string>();
                                  debugSteps.forEach((s) =>
                                    Object.keys(s.variables || {}).forEach((v) =>
                                      allVars.add(v),
                                    ),
                                  );
                                  allVars.forEach((v) => {
                                    suggestions.push({
                                      label: v,
                                      kind: monaco.languages.CompletionItemKind.Variable,
                                      insertText: v,
                                      documentation: "Variable detected in recent execution.",
                                      range
                                    } as any);
                                  });
                                }

                                return { suggestions };
                              }
                            });

                            // Hover Provider
                            monaco.languages.registerHoverProvider("c", {
                              provideHover: (model, position) => {
                                const word = model.getWordAtPosition(position);
                                if (!word) return null;

                                const hoverDocs: Record<string, string> = {
                                  printf: "**printf(const char *format, ...)**\n\nPrints formatted output to the standard output stream.",
                                  scanf: "**scanf(const char *format, ...)**\n\nReads formatted input from the standard input stream.",
                                  main: "**main()**\n\nThe main entry point for a C program.",
                                  malloc: "**malloc(size_t size)**\n\nAllocates `size` bytes of uninitialized memory.",
                                  free: "**free(void *ptr)**\n\nDeallocates memory previously allocated by `malloc`, `calloc`, or `realloc`.",
                                  strcmp: "**strcmp(const char *s1, const char *s2)**\n\nCompares two strings. Returns 0 if they are equal."
                                };

                                if (hoverDocs[word.word]) {
                                  return {
                                    range: new monaco.Range(
                                      position.lineNumber,
                                      word.startColumn,
                                      position.lineNumber,
                                      word.endColumn
                                    ),
                                    contents: [
                                      { value: hoverDocs[word.word] }
                                    ]
                                  };
                                }
                                return null;
                              }
                            });

                            // Signature Help Provider
                            monaco.languages.registerSignatureHelpProvider("c", {
                              signatureHelpTriggerCharacters: ["(", ","],
                              provideSignatureHelp: (model, position) => {
                                const lineContent = model.getLineContent(position.lineNumber);
                                const textUntilPosition = lineContent.substring(0, position.column - 1);
                                const match = textUntilPosition.match(/(printf|scanf|malloc|free|strcmp)\s*\(/);
                                if (match) {
                                  const fn = match[1];
                                  const signatures: any[] = [];
                                  if (fn === 'printf') {
                                    signatures.push({ label: 'int printf(const char *format, ...)', parameters: [{ label: 'const char *format' }, { label: '...' }] });
                                  } else if (fn === 'scanf') {
                                    signatures.push({ label: 'int scanf(const char *format, ...)', parameters: [{ label: 'const char *format' }, { label: '...' }] });
                                  } else if (fn === 'malloc') {
                                    signatures.push({ label: 'void* malloc(size_t size)', parameters: [{ label: 'size_t size' }] });
                                  } else if (fn === 'free') {
                                    signatures.push({ label: 'void free(void *ptr)', parameters: [{ label: 'void *ptr' }] });
                                  } else if (fn === 'strcmp') {
                                    signatures.push({ label: 'int strcmp(const char *s1, const char *s2)', parameters: [{ label: 'const char *s1' }, { label: 'const char *s2' }] });
                                  }
                                  return { value: { signatures, activeSignature: 0, activeParameter: textUntilPosition.split(',').length - 1 }, dispose: () => {} };
                                }
                                return null;
                              }
                            });
                          }

                          // Handle Drop for snippets
                          editor.onDidPaste((e) => {
                            // Standard paste handled by Monaco
                          });

                          const container = editor.getDomNode();
                          if (container) {
                            container.addEventListener("dragover", (e) => {
                              e.preventDefault();
                            });
                            container.addEventListener("drop", (e: any) => {
                              e.preventDefault();
                              const text = e.dataTransfer.getData("text/plain");
                              if (text) {
                                const position =
                                  (editor as any).getTargetAtEvent(e.nativeEvent || e)?.position;
                                if (position) {
                                  editor.executeEdits("snippet-drop", [
                                    {
                                      range: new monaco.Range(
                                        position.lineNumber,
                                        position.column,
                                        position.lineNumber,
                                        position.column,
                                      ),
                                      text: text,
                                      forceMoveMarkers: true,
                                    },
                                  ]);
                                  editor.setPosition(position);
                                  editor.focus();
                                }
                              }
                            });
                          }

                          // Interactive Debugging / Error Explanation
                          editor.onDidChangeCursorSelection((e: any) => {
                            const selection = editor.getModel()?.getValueInRange(e.selection) || "";
                            setCodeSelection(selection);
                          });

                          editor.onMouseDown((e: any) => {
                            const line = e.target.position?.lineNumber;
                            if (!line) return;

                            if (
                              e.target.type ===
                              monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
                            ) {
                              toggleBreakpoint(line);
                              return;
                            }

                            if (
                              e.target.type ===
                                monaco.editor.MouseTargetType.CONTENT_WIDGET ||
                              e.target.type ===
                                monaco.editor.MouseTargetType.CONTENT_TEXT
                            ) {
                              const markers = monaco.editor.getModelMarkers({
                                resource: editor.getModel().uri,
                              });
                              const markerOnLine = markers.find(
                                (m) => m.startLineNumber === line,
                              );
                              if (markerOnLine) {
                                handleExplain(markerOnLine.message);
                              }
                            }
                          });

                          // Add pop-up logic: we can use markers to show icons in the gutter
                          // The handleExplain already pulls up the AI panel, but let's add a small marker icon
                          monaco.editor.setModelMarkers(
                            editor.getModel(),
                            "owner",
                            [],
                          );

                          // Hover Provider for Debugging
                          monaco.languages.registerHoverProvider("c", {
                            provideHover: (model, position) => {
                              const word = model.getWordAtPosition(position);
                              if (!word || !isDebugging || currentStepIndex === -1)
                                return null;

                              const step = debugSteps[currentStepIndex];
                              if (step && step.variables) {
                                const value = step.variables[word.word];
                                if (value !== undefined) {
                                  // Improved type detection for hover tooltips
                                  let valueStr = String(value);
                                  let type = "Primitive";

                                  if (typeof value === "number") {
                                    type = Number.isInteger(value)
                                      ? "int"
                                      : "double";
                                  } else if (typeof value === "string") {
                                    if (/^0x[0-9a-fA-F]+$/.test(value))
                                      type = "void* / pointer";
                                    else if (value === "NULL" || value === "null")
                                      type = "NULL pointer";
                                    else if (value.length === 1) type = "char";
                                    else type = "string";
                                  } else if (Array.isArray(value)) {
                                    type = "array / buffer";
                                  } else if (
                                    typeof value === "object" &&
                                    value !== null
                                  ) {
                                    type = "struct / object";
                                  }

                                  return {
                                    range: new monaco.Range(
                                      position.lineNumber,
                                      word.startColumn,
                                      position.lineNumber,
                                      word.endColumn,
                                    ),
                                    contents: [
                                      {
                                        value: `**Variable:** \`${word.word}\`  \n**Type:** \`${type}\``,
                                      },
                                      {
                                        value: `**Current Value:** \`${valueStr}\``,
                                      },
                                      {
                                        value: type.includes("pointer")
                                          ? `*Points to memory address ${valueStr}*`
                                          : "",
                                      },
                                    ].filter((c) => c.value),
                                  };
                                }
                              }
                              return null;
                            },
                          });
                        }}
                        onChange={(value) => setCode(value || "")}
                      />
                      </div>
                    </div>
                  
          </div>
          
          {/* Terminal drag handle (horizontal) */}
          {panels.terminal && (
            <div
              onMouseDown={useDrag(delta => {
                setTerminalHeight(h => Math.max(TERMINAL_MIN, Math.min(TERMINAL_MAX, h - delta)));
              }, 'y')}
              style={{
                height: 4, flexShrink: 0, cursor: 'row-resize',
                background: 'transparent', borderTop: '1px solid #2d3139',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1f6feb')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />
          )}

          {/* Terminal — fixed height when open */}
          <motion.div
            data-tour="terminal-panel"
            animate={{
              height: panels.terminal ? terminalHeight : 0,
              minHeight: panels.terminal ? terminalHeight : 0,
            }}
            transition={EASE_IN_OUT}
            style={{
              flexShrink: 0,
              overflow: 'hidden',
              background: '#0d1117',
            }}
          >
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
                        {debugSteps[currentStepIndex]?.insight && (
                          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-blue-200">
                             <div className="font-bold text-[9px] uppercase mb-1 opacity-70">AI Insight</div>
                             <div className="font-sans text-xs">{debugSteps[currentStepIndex].insight}</div>
                          </div>
                        )}
                        <div className="mt-3 text-[9px] uppercase font-bold text-gray-500">Output Log:</div>
                        <pre className="text-gray-300 whitespace-pre-wrap">{debugSteps[currentStepIndex]?.output || output}</pre>
                    </div>
                  ) : (
                    output ? output.split("\n").map((line, i) => {
                      const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("failed");
                      const isWarning = line.toLowerCase().includes("warning");
                      let textColor = "text-gray-300";
                      if (isError) textColor = "text-red-400";
                      else if (isWarning) textColor = "text-yellow-400";
                      return (
                        <div key={i} className={`group flex gap-3 hover:bg-white/5 px-2 py-0.5 rounded-sm transition-colors ${textColor}`}>
                          <span className="opacity-30 select-none w-6 text-right shrink-0">{i + 1}</span>
                          <span className="break-all">{line}</span>
                          {isError && (
                            <button
                              onClick={() => handleExplain(line)}
                              className="ml-auto opacity-0 group-hover:opacity-100 bg-red-500/20 text-red-300 hover:bg-red-500/40 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold transition-all"
                            >
                              Explain
                            </button>
                          )}
                        </div>
                      );
                    }) : <div className="opacity-30 italic">Terminal ready...</div>
                  )}
                </div>
              </div>
          </motion.div>
        </div>

        {/* Agent drag handle */}
        {panels.agent && (
          <div
            onMouseDown={useDrag(delta => {
              setAgentWidth(w => Math.max(AGENT_MIN, Math.min(AGENT_MAX, w - delta)));
            })}
            style={{
              width: 4, flexShrink: 0, cursor: 'col-resize',
              background: 'transparent', borderLeft: '1px solid #2d3139',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1f6feb')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          />
        )}

        {/* ── RIGHT SIDEBAR (AI) ───────────────────── */}
        <motion.aside
          data-tour="ai-panel"
          animate={{
            width: panels.agent ? agentWidth : 0,
            minWidth: panels.agent ? agentWidth : 0,
          }}
          transition={EASE_IN_OUT}
          style={{
            flexShrink: 0,
            overflow: 'hidden',
            background: '#1a1d23',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
           <div className="flex flex-col h-full overflow-hidden">
                          <div className="h-10 border-b border-[#1A1A1A] flex items-center justify-between px-4 shrink-0 shadow-sm">
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-blue-400 tracking-widest">
                              <Sparkles className="w-3.5 h-3.5" />
                              Gemini Flash AI
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setMessages([])}
                                className="text-[9px] opacity-40 hover:opacity-100 uppercase font-bold mr-2"
                              >
                                Clear chat
                              </button>
                              <div className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
                                Active
                              </div>
                              <button
                                onClick={() => togglePanelState("agent")}
                                className="opacity-40 hover:opacity-100 transition-all text-[10px]"
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          {/* Adaptive Profile Indicator */}
                          {errorProfile.topErrors.length > 0 && (
                            <div style={{
                              margin: '8px 12px',
                              padding: '8px 10px',
                              background: '#1a1f2e',
                              border: '1px solid #1f3a6e',
                              borderRadius: 6,
                              fontSize: 11,
                            }}>
                              <div style={{
                                color: '#58a6ff',
                                fontWeight: 600,
                                marginBottom: 4,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}>
                                🧠 Adaptive Profile Active
                                <span style={{
                                  background: '#1f6feb',
                                  color: '#fff',
                                  borderRadius: 8,
                                  padding: '0 5px',
                                  fontSize: 10,
                                  marginLeft: 'auto',
                                }}>
                                  {errorProfile.sessionCount} sessions analyzed
                                </span>
                              </div>
                              <div style={{ color: '#8b949e', lineHeight: 1.5 }}>
                                AI tuned for your top errors:
                              </div>
                              {errorProfile.topErrors.map((err, i) => (
                                <div key={i} style={{ color: '#c9d1d9', fontSize: 10, marginTop: 2 }}>
                                  · {err}
                                </div>
                              ))}
                            </div>
                          )}

                          <div
                            className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth"
                            ref={(el) => {
                              if (el) el.scrollTop = el.scrollHeight;
                            }}
                          >
                            {output.includes("Error:") &&
                              messages.length === 0 &&
                              !isExplaining && (
                                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex flex-col gap-2">
                                  <div className="flex items-center gap-2 text-red-300 text-[10px] font-bold uppercase tracking-widest">
                                    <Info className="w-3 h-3" /> Fix Recommended
                                  </div>
                                  <p className="text-[10px] text-red-200 opacity-80">
                                    I detected a compile error. Would you like me to
                                    analyze it?
                                  </p>
                                  <button
                                    onClick={() => handleExplain(output)}
                                    className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-300 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-red-500/30 transition-all"
                                  >
                                    Analyze Error
                                  </button>
                                </div>
                              )}

                            {messages.length === 0 && !isExplaining ? (
                              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
                                <Sparkles className="w-10 h-10 text-blue-400 mb-6 animate-pulse" />
                                <p className="text-xs font-bold uppercase tracking-wider mb-2">
                                  AI Assistant Ready
                                </p>
                                <p className="text-[10px] leading-relaxed italic max-w-[180px]">
                                  Compile your code or ask a question to receive
                                  intelligent analysis.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {messages.map((m, i) => (
                                  <div
                                    key={i}
                                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                  >
                                    <div
                                      className={`max-w-[100%] p-3 rounded-xl text-[12px] leading-relaxed shadow-lg ${
                                        m.role === "user"
                                          ? "bg-blue-600 text-white rounded-tr-none"
                                          : "bg-[#2D2D30] text-gray-300 border border-[#3E3E42] rounded-tl-none markdown-body prose prose-invert prose-p:my-1 prose-code:text-blue-300"
                                      }`}
                                    >
                                      {m.role === "ai" ? (
                                        <>
                                          <div className="text-[9px] text-blue-400 font-bold mb-1 uppercase tracking-widest flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5" /> Gemini
                                          </div>
                                          <Markdown
                                            components={{
                                              code(props) {
                                                const {children, className, node, ref, ...rest} = props
                                                const match = /language-(\w+)/.exec(className || '')
                                                return match ? (
                                                  <div className="relative mt-2 mb-2 group">
                                                    <SyntaxHighlighter
                                                      {...rest}
                                                      children={String(children).replace(/\n$/, '')}
                                                      style={vscDarkPlus}
                                                      language={match[1]}
                                                      PreTag="div"
                                                      customStyle={{ margin: 0, borderRadius: '6px' }}
                                                    />
                                                    <button
                                                      onClick={() => {
                                                        const editor = editorRef.current;
                                                        if (editor) {
                                                          const position = editor.getPosition() || { lineNumber: 1, column: 1 };
                                                          editor.executeEdits("ai-insert", [{
                                                            range: new monacoRef.current.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                                                            text: String(children).replace(/\n$/, ''),
                                                            forceMoveMarkers: true,
                                                          }]);
                                                          // Focus editor after insertion
                                                          editor.focus();
                                                        }
                                                      }}
                                                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2d2d30] hover:bg-[#3E3E42] text-[10px] text-blue-400 py-1 px-2 border border-[#444] rounded cursor-pointer"
                                                    >
                                                      Insert to Editor
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <code {...rest} className={className}>
                                                    {children}
                                                  </code>
                                                )
                                              }
                                            }}
                                          >{m.content}</Markdown>
                                        </>
                                      ) : (
                                        m.content
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {isExplaining && (
                                  <div className="flex justify-start">
                                    <div className="max-w-[90%] p-3 rounded-xl rounded-tl-none bg-[#2D2D30] text-gray-300 border border-[#3E3E42] shadow-lg flex items-center gap-3">
                                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                      <span className="text-[11px] opacity-80 animate-pulse">
                                        Analyzing code & generating explanation...
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="p-4 bg-[#252526] border-t border-[#1A1A1A]">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const input = new FormData(
                                  e.currentTarget,
                                ).get("message") as string;
                                if (input.trim()) {
                                  // Do not add the message here, it will be added in handleExplain
                                  e.currentTarget.reset();
                                  setTimeout(
                                    () =>
                                      handleExplain(
                                        `Answer this question contextually based on my current code: ${input}`,
                                      ),
                                    50,
                                  );
                                }
                              }}
                              className="relative"
                            >
                              <input
                                type="text"
                                name="message"
                                placeholder="Ask AI about your code..."
                                className="w-full bg-[#1e1e1e] border border-[#333333] rounded-lg pl-3 pr-10 py-2.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                                autoComplete="off"
                              />
                              <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </form>
                          </div>
                        </div>
        </motion.aside>

      </div>




      {/* Toggle AI Button (when hidden) */}
      {!showAI && (
        <button
          onClick={() => setShowAI(true)}
          className="fixed bottom-10 right-6 bg-blue-600 p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all text-white z-50 animate-bounce"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Footer Status Bar */}
      <footer className="h-6 bg-[#007ACC] flex items-center px-3 justify-between text-[10px] text-white shrink-0 font-medium z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 opacity-90">
            <Code2 className="w-3 h-3" />
            <span>main.c</span>
          </div>
          <div className="opacity-90">UTF-8</div>
          <div className="opacity-90">C (GCC 11.4)</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="opacity-90">Ln 1, Col 1</div>
          <div className="opacity-90">Spaces: 4</div>
          <div className="flex items-center gap-2 opacity-90">
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Prettier</span>
          </div>
        </div>
      </footer>
      <TourOverlay />
    </div>
  );
}
