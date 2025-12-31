import type { PageSchema } from "../../types/siteSchema";

interface PageTabsProps {
  pages: PageSchema[];
  activePageId: string;
  onPageSelect: (pageId: string) => void;
  onPageAdd: () => void;
  onPageRename: (pageId: string, newName: string) => void;
  onPageDelete: (pageId: string) => void;
}

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
                  if (confirm(`Delete page "${page.name}"?`)) {
                    onPageDelete(page.id);
                  }
                }}
              >
                ×
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
