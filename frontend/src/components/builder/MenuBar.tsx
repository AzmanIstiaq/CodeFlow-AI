/**
 * Menu Bar
 *
 * Purpose:
 * - Provide top-level application actions, view controls, and page navigation.
 *
 * Role in the system:
 * - Acts as the global command surface for the builder.
 *
 * Key responsibilities:
 * - Assemble menu definitions and drive dropdown behavior.
 * - Forward actions to parent callbacks.
 * - Offer page selection and quick save/export buttons.
 *
 * Important constraints and assumptions:
 * - All actions are optional and should be null-safe.
 * - Inline hover styles are used to avoid external style dependencies.
 */

import { useState } from "react";

// ================================
// Types
// ================================
type MenuItem =
  | { type: "divider" }
  | { label: string; shortcut?: string; action?: () => void; disabled?: boolean };

interface MenuBarProps {
  onSave?: () => void;
  onExport?: () => void;
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
  pages?: any[];
  activePageId?: string;
  onPageSelect?: (pageId: string) => void;
  onPageAdd?: () => void;
  onPageRename?: (pageId: string, newName: string) => void;
  onPageDelete?: (pageId: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onDeselect?: () => void;
  onDuplicate?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
  onHide?: () => void;
  onShow?: () => void;
  onBringToFront?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onSendToBack?: () => void;
  onToggleGrid?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomToFit?: () => void;
  onZoomTo100?: () => void;
  onViewportChange?: (viewport: "desktop" | "tablet" | "mobile") => void;
  currentViewport?: "desktop" | "tablet" | "mobile";
  showGrid?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelection?: boolean;
}

// ================================
// Component
// ================================
/**
 * Global menu bar for navigation, editing, view, and object actions.
 */
export default function MenuBar({
  onSave,
  onExport,
  onNavigateHome,
  onNavigateDashboard,
  pages = [],
  activePageId,
  onPageSelect,
  onPageAdd,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  onDeselect,
  onDuplicate,
  onLock,
  onHide,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onZoomTo100,
  onViewportChange,
  currentViewport = "desktop",
  showGrid = false,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const activePage = pages.find((p) => p.id === activePageId);

  // ================================
  // Menu Definitions
  // ================================
  const menus: Array<{ name: string; items: MenuItem[] }> = [
    {
      name: "File",
      items: [
        { label: "New Page", shortcut: "Ctrl+N", action: onPageAdd },
        { type: "divider" },
        { label: "Save", shortcut: "Ctrl+S", action: onSave },
        { label: "Export HTML", shortcut: "Ctrl+Shift+E", action: onExport },
      ],
    },
    {
      name: "Edit",
      items: [
        { label: "Undo", shortcut: "Ctrl+Z", action: onUndo, disabled: !canUndo },
        { label: "Redo", shortcut: "Ctrl+Y", action: onRedo, disabled: !canRedo },
        { type: "divider" },
        { label: "Cut", shortcut: "Ctrl+X", action: onCut, disabled: !hasSelection },
        { label: "Copy", shortcut: "Ctrl+C", action: onCopy, disabled: !hasSelection },
        { label: "Paste", shortcut: "Ctrl+V", action: onPaste },
        { label: "Duplicate", shortcut: "Ctrl+D", action: onDuplicate, disabled: !hasSelection },
        { type: "divider" },
        { label: "Delete", shortcut: "Del", action: onDelete, disabled: !hasSelection },
        { label: "Select All", shortcut: "Ctrl+A", action: onSelectAll },
        { label: "Deselect", shortcut: "Esc", action: onDeselect, disabled: !hasSelection },
      ],
    },
    {
      name: "View",
      items: [
        { label: "Zoom In", shortcut: "+", action: onZoomIn },
        { label: "Zoom Out", shortcut: "-", action: onZoomOut },
        { label: "Zoom to 100%", shortcut: "Ctrl+0", action: onZoomTo100 },
        { label: "Zoom to Fit", shortcut: "Shift+1", action: onZoomToFit },
        { type: "divider" },
        {
          label: showGrid ? "Hide Grid" : "Show Grid",
          shortcut: "Ctrl+'",
          action: onToggleGrid,
        },
        { type: "divider" },
        {
          label:
            currentViewport === "desktop" ? "?\" Desktop View" : "Desktop View",
          action: () => onViewportChange?.("desktop"),
        },
        {
          label:
            currentViewport === "tablet" ? "?\" Tablet View" : "Tablet View",
          action: () => onViewportChange?.("tablet"),
        },
        {
          label:
            currentViewport === "mobile" ? "?\" Mobile View" : "Mobile View",
          action: () => onViewportChange?.("mobile"),
        },
      ],
    },
    {
      name: "Object",
      items: [
        { label: "Lock", shortcut: "Ctrl+Shift+L", action: onLock, disabled: !hasSelection },
        { label: "Hide", shortcut: "Ctrl+Shift+H", action: onHide, disabled: !hasSelection },
        { type: "divider" },
        { label: "Bring to Front", shortcut: "Ctrl+]", action: onBringToFront, disabled: !hasSelection },
        { label: "Bring Forward", shortcut: "Ctrl+[", action: onBringForward, disabled: !hasSelection },
        { label: "Send Backward", shortcut: "Ctrl+Alt+[", action: onSendBackward, disabled: !hasSelection },
        { label: "Send to Back", shortcut: "Ctrl+Alt+]", action: onSendToBack, disabled: !hasSelection },
      ],
    },
  ];

  // ================================
  // Interaction Handlers
  // ================================
  /**
   * Toggle a menu open or closed by name.
   */
  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  /**
   * Execute a menu action and close the active menu.
   */
  const handleItemClick = (action?: () => void) => {
    if (action) {
      action();
    }
    setActiveMenu(null);
  };

  // ================================
  // Render
  // ================================
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: "#1f2937",
        borderBottom: "1px solid #374151",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        zIndex: 2000,
        userSelect: "none",
      }}
      onMouseLeave={() => setActiveMenu(null)}
    >
      {/* Logo and Navigation */}
      <button
        onClick={onNavigateHome}
        style={{
          background: "none",
          border: "none",
          color: "#ffffff",
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          padding: "8px 12px",
          borderRadius: 6,
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
        }}
      >
        CodeFlow AI
      </button>

      <button
        onClick={onNavigateDashboard}
        style={{
          background: "none",
          border: "none",
          color: "#9ca3af",
          fontSize: 14,
          cursor: "pointer",
          padding: "6px 12px",
          borderRadius: 6,
          transition: "all 0.1s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          e.currentTarget.style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "#9ca3af";
        }}
      >
        Dashboard
      </button>

      <div
        style={{ width: 1, height: 24, background: "#374151", margin: "0 4px" }}
      />

      {/* Menu Bar */}
      {menus.map((menu) => (
        <div key={menu.name} style={{ position: "relative" }}>
          <button
            onClick={() => handleMenuClick(menu.name)}
            style={{
              background:
                activeMenu === menu.name
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
              border: "none",
              padding: "6px 12px",
              fontSize: 13,
              color: "#e5e7eb",
              cursor: "pointer",
              borderRadius: 4,
              fontWeight: 500,
              transition: "background 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (activeMenu && activeMenu !== menu.name) {
                setActiveMenu(menu.name);
              }
              if (!activeMenu) {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeMenu !== menu.name) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {menu.name}
          </button>

          {activeMenu === menu.name && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                minWidth: 220,
                padding: "4px 0",
                zIndex: 3000,
              }}
            >
              {menu.items.map((item, idx) => {
                if ("type" in item && item.type === "divider") {
                  return (
                    <div
                      key={`divider-${idx}`}
                      style={{
                        height: 1,
                        backgroundColor: "#e5e7eb",
                        margin: "4px 0",
                      }}
                    />
                  );
                }

                if ("label" in item) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleItemClick(item.action)}
                      disabled={item.disabled}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        padding: "8px 16px",
                        fontSize: 13,
                        color: item.disabled ? "#9ca3af" : "#374151",
                        cursor: item.disabled ? "not-allowed" : "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!item.disabled) {
                          e.currentTarget.style.background = "#f3f4f6";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginLeft: 24,
                          }}
                        >
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      ))}

      {/* Page Selector */}
      {pages.length > 0 && (
        <>
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative" }}>
            <button
              onClick={() =>
                setActiveMenu(activeMenu === "pages" ? null : "pages")
              }
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid #374151",
                padding: "6px 12px",
                fontSize: 13,
                color: "#e5e7eb",
                cursor: "pointer",
                borderRadius: 6,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{activePage?.name || "Select Page"}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {activeMenu === "pages" && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  minWidth: 200,
                  padding: "4px 0",
                  zIndex: 3000,
                }}
              >
                <button
                  onClick={() => {
                    if (onPageAdd) onPageAdd();
                    setActiveMenu(null);
                  }}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px 16px",
                    fontSize: 13,
                    color: "#3b82f6",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: 600,
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  + Add Page
                </button>
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      if (onPageSelect) onPageSelect(page.id);
                      setActiveMenu(null);
                    }}
                    style={{
                      width: "100%",
                      background:
                        page.id === activePageId ? "#eff6ff" : "transparent",
                      border: "none",
                      padding: "8px 16px",
                      fontSize: 13,
                      color: "#374151",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: page.id === activePageId ? 600 : 400,
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (page.id !== activePageId) {
                        e.currentTarget.style.background = "#f3f4f6";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        page.id === activePageId ? "#eff6ff" : "transparent";
                    }}
                  >
                    {page.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onSave}
            style={{
              background: "#3b82f6",
              border: "none",
              padding: "8px 16px",
              fontSize: 13,
              color: "#ffffff",
              cursor: "pointer",
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Save
          </button>

          <button
            onClick={onExport}
            style={{
              background: "#10b981",
              border: "none",
              padding: "8px 16px",
              fontSize: 13,
              color: "#ffffff",
              cursor: "pointer",
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Export HTML
          </button>
        </>
      )}
    </div>
  );
}
