import { Search, LayoutGrid, List } from 'lucide-react';

export default function ProjectFilters({
  search, setSearch,
  status, setStatus,
  sort, setSort,
  view, setView,
}) {
  return (
    <div className="filters-bar">
      <div className="search-input-wrap">
        <Search />
        <input
          className="search-input"
          placeholder="Search projects by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Archived">Archived</option>
      </select>
      <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="updated">Recently Updated</option>
        <option value="created">Recently Created</option>
        <option value="name">Name A–Z</option>
      </select>
      <div className="view-toggle">
        <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grid view">
          <LayoutGrid size={16} />
        </button>
        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view">
          <List size={16} />
        </button>
      </div>
    </div>
  );
}
