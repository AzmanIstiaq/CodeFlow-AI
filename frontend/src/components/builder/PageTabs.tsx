/**
 * Page Tabs
 *
 * Purpose:
 * - Provide tab-based navigation between pages in the site.
 *
 * Role in the system:
 * - Acts as the primary UI for selecting and deleting pages.
 *
 * Key responsibilities:
 * - Render page tabs with active state styling.
 * - Handle page selection and deletion with confirmation.
 * - Provide an affordance to add new pages.
 *
 * Important constraints and assumptions:
 * - Deleting the last page is prevented at the UI level.
 * - Rename support is not wired here; handler is accepted but unused.
 */

import type { PageSchema } from "../../types/siteSchema";

// ================================
// Types
// ================================
interface PageTabsProps {
  pages: PageSchema[];
  activePageId: string;
  onPageSelect: (pageId: string) => void;
  onPageAdd: () => void;
  onPageRename: (pageId: string, newName: string) => void;
  onPageDelete: (pageId: string) => void;
}

// ================================
// Component
// ================================
/**
 * Render selectable tabs for each page in the site.
 */
export default function PageTabs({
  pages,
  activePageId,
  onPageSelect,
  onPageAdd,
  onPageRename: _onPageRename,
  onPageDelete,
}: PageTabsProps) {
  return (
    <div className="page-tabs">
      <div className="page-tabs-list">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`page-tab ${page.id === activePageId ? "active" : ""}`}
            onClick={() => onPageSelect(page.id)}
          >
            <span className="page-tab-name">{page.name}</span>
            {pages.length > 1 && (
              <button
                className="page-tab-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  // Confirm before deleting to prevent accidental loss.
                  if (confirm(`Delete page "${page.name}"?`)) {
                    onPageDelete(page.id);
                  }
                }}
              >
                A-
              </button>
            )}
          </div>
        ))}
        <button className="page-tab-add" onClick={onPageAdd}>
          + Add Page
        </button>
      </div>
    </div>
  );
}
