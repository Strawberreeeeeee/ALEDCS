const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add IconButton and ToolbarBtn, useWindowWidth before App definition
if (!content.includes('interface IconButtonProps')) {
  const insertIndex = content.indexOf('export default function App() {');
  
  const insertions = `
interface IconButtonProps {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}
const IconButton: React.FC<IconButtonProps> = ({ onClick, active, title, children }) => (
  <button onClick={onClick} title={title} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
    background: active ? '#1f2937' : 'transparent',
    color: active ? '#58a6ff' : '#8b949e',
  }}>
    {children}
  </button>
);

interface ToolbarBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}
const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ icon, label, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
    background: 'transparent', border: '1px solid #2d3139', borderRadius: 5,
    color: '#8b949e', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap',
  }}>
    {icon}{label}
  </button>
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

`;
  content = content.slice(0, insertIndex) + insertions + content.slice(insertIndex);
}

fs.writeFileSync('src/App.tsx', content);
