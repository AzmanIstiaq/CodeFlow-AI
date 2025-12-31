interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
}

export default function CollapsibleSection({ 
  id, 
  title, 
  icon, 
  children, 
  isCollapsed, 
  onToggle 
}: CollapsibleSectionProps) {
  return (
    <>
      <div className="panel-section-header" onClick={() => onToggle(id)}>
        <div className="panel-section-header-title">
          {icon && <span>{icon}</span>}
          {title}
        </div>
        <svg 
          className={`panel-section-collapse-icon ${isCollapsed ? 'collapsed' : ''}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <div className={`panel-section-content ${isCollapsed ? 'collapsed' : ''}`}>
        {children}
      </div>
    </>
  );
}
