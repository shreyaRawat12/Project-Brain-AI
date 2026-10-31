import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import * as knowledgeGraphService from '../services/knowledgeGraphService';
import { Search, ZoomIn, ZoomOut, Maximize2, RotateCcw, RefreshCw, Filter, X, ArrowRight, Box, File, FunctionSquare, Code2, FileText, GitCommit, Lightbulb, CircleDot } from 'lucide-react';
import './ProjectKnowledge.css';

const NODE_TYPE_META = {
  project: { label: 'Project', color: '#159D91', icon: Box },
  module: { label: 'Module', color: '#75C6B0', icon: CircleDot },
  file: { label: 'File', color: '#4FC3F7', icon: File },
  function: { label: 'Function', color: '#A78BFA', icon: FunctionSquare },
  class: { label: 'Class', color: '#F472B6', icon: Code2 },
  document: { label: 'Document', color: '#FBBF24', icon: FileText },
  decision: { label: 'Decision', color: '#F97316', icon: Lightbulb },
  commit: { label: 'Commit', color: '#60A5FA', icon: GitCommit },
  dependency: { label: 'Dependency', color: '#94A3B8', icon: CircleDot },
};

const RADIUS_BY_TYPE = { project: 0, module: 150, document: 210, decision: 230, file: 300, dependency: 320, function: 390, class: 390, commit: 340 };

function computePositions(nodes) {
  const positions = {};
  const groups = {};
  nodes.forEach((n) => {
    const t = n.type in RADIUS_BY_TYPE ? n.type : 'module';
    if (!groups[t]) groups[t] = [];
    groups[t].push(n);
  });
  Object.entries(groups).forEach(([type, list]) => {
    const r = RADIUS_BY_TYPE[type] || 260;
    if (r === 0) { list.forEach((n) => { positions[n.id] = { x: 0, y: 0 }; }); return; }
    const count = list.length;
    list.forEach((n, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      positions[n.id] = { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
  });
  return positions;
}

function neighborsOf(graph, id) {
  const set = new Set();
  if (!graph) return set;
  graph.edges.forEach((e) => {
    if (e.source === id) set.add(e.target);
    if (e.target === id) set.add(e.source);
  });
  return set;
}

export default function ProjectKnowledge() {
  const { projectId } = useParams();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const resolvedProjectId = projectId || (projects && projects.length ? projects[0].id : null);

  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [nodeTypeFilter, setNodeTypeFilter] = useState('all');
  const [edgeTypeFilter, setEdgeTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const containerRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const positions = useMemo(() => (graph ? computePositions(graph.nodes) : {}), [graph]);
  const adjacency = useMemo(() => {
    const map = new Map();
    if (!graph) return map;
    graph.nodes.forEach((n) => map.set(n.id, new Set()));
    graph.edges.forEach((e) => {
      if (map.has(e.source)) map.get(e.source).add(e.target);
      if (map.has(e.target)) map.get(e.target).add(e.source);
    });
    return map;
  }, [graph]);

  const highlightSet = useMemo(() => {
    if (!selectedId) return null;
    const set = new Set([selectedId]);
    neighborsOf(graph, selectedId).forEach((x) => set.add(x));
    return set;
  }, [graph, selectedId]);

  const nodeTypesPresent = useMemo(() => (graph ? [...new Set(graph.nodes.map((n) => n.type))] : []), [graph]);
  const edgeTypesPresent = useMemo(() => (graph ? [...new Set(graph.edges.map((e) => e.type))] : []), [graph]);

  const visibleNodes = useMemo(() => {
    if (!graph) return [];
    return graph.nodes.filter((n) => nodeTypeFilter === 'all' || n.type === nodeTypeFilter);
  }, [graph, nodeTypeFilter]);

  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    if (!graph) return [];
    return graph.edges.filter((e) => {
      if (!visibleIds.has(e.source) || !visibleIds.has(e.target)) return false;
      if (edgeTypeFilter !== 'all' && e.type !== edgeTypeFilter) return false;
      return true;
    });
  }, [graph, visibleIds, edgeTypeFilter]);

  const fetchGraph = useCallback(async () => {
    if (!resolvedProjectId) { setGraph(null); setError('no-project'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const data = await knowledgeGraphService.getKnowledgeGraph(resolvedProjectId);
      setGraph(data); setSelectedId(null);
    } catch (e) { setError('failed'); setGraph(null); }
    finally { setLoading(false); }
  }, [resolvedProjectId]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  const doSearch = useCallback((q) => {
    if (!graph || !q.trim()) { setSearchResults([]); return; }
    const needle = q.toLowerCase();
    const results = graph.nodes.filter((n) => {
      const hay = [n.label, n.description, n.metadata?.path, n.metadata?.module, n.metadata?.file].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(needle);
    });
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  }, [graph]);

  useEffect(() => { doSearch(search); }, [search, doSearch]);

  const focusNode = useCallback((id) => {
    const pos = positions[id];
    if (!pos || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTransform((prev) => ({ ...prev, x: rect.width / 2 - pos.x * prev.scale, y: rect.height / 2 - pos.y * prev.scale }));
    setSelectedId(id); setShowSearchResults(false);
  }, [positions]);

  const zoomIn = () => setTransform((p) => ({ ...p, scale: Math.min(p.scale * 1.2, 4) }));
  const zoomOut = () => setTransform((p) => ({ ...p, scale: Math.max(p.scale / 1.2, 0.3) }));
  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || visibleNodes.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    visibleNodes.forEach((n) => {
      const p = positions[n.id]; if (!p) return;
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
    const pad = 80;
    const rangeX = (maxX - minX) || 1;
    const rangeY = (maxY - minY) || 1;
    const scale = Math.min((rect.width - pad * 2) / rangeX, (rect.height - pad * 2) / rangeY, 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setTransform({ x: rect.width / 2 - cx * scale, y: rect.height / 2 - cy * scale, scale: Math.max(0.3, scale) });
  }, [visibleNodes, positions]);

  const onPointerDown = (e) => {
    if (e.target !== containerRef.current && !e.target.classList.contains('graph-bg')) return;
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, baseX: transform.x, baseY: transform.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTransform((p) => ({ ...p, x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy }));
  };
  const onPointerUp = () => { dragRef.current.dragging = false; };
  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((p) => ({ ...p, scale: Math.min(4, Math.max(0.3, p.scale * factor)) }));
  };

  const selectedNode = graph ? graph.nodes.find((n) => n.id === selectedId) : null;

  const askAI = () => {
    if (!selectedNode) return;
    const label = selectedNode.label;
    let question = `Explain ${label} in the project context.`;
    if (selectedNode.type === 'file') question = `Explain how ${label} connects to the rest of the project.`;
    else if (selectedNode.type === 'module') question = `Explain the responsibilities and dependencies of ${label}.`;
    else if (selectedNode.type === 'decision') question = `Explain the context and impact of decision ${label}.`;
    else if (selectedNode.type === 'document') question = `Summarize the knowledge in ${label}.`;
    navigate('/assistant', { state: { question, nodeId: selectedNode.id } });
  };

  return (
    <motion.div className="kg-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <header className="kg-header">
        <div>
          <div className="kg-eyebrow">PROJECT INTELLIGENCE</div>
          <h1 className="kg-title">Knowledge Graph</h1>
          <p className="kg-subtitle">Explore how your project's files, modules, decisions, and knowledge are connected.</p>
        </div>
        <div className="kg-header-right">
          <div className="kg-project-indicator">
            <span className="kg-dot" />
            {resolvedProjectId ? (projects.find((p) => p.id === resolvedProjectId)?.name || resolvedProjectId) : 'No project'}
          </div>
          <div className={`kg-status-pill ${graph?.demo ? 'preview' : 'ready'}`}>
            {graph?.demo ? 'Preview data' : 'Graph ready'}
          </div>
          <button type="button" className="kg-btn" onClick={fetchGraph} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'kg-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {!loading && graph && (
        <motion.div className="kg-stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="kg-stat-card"><div className="kg-stat-value">{graph.statistics?.total_nodes ?? graph.nodes.length}</div><div className="kg-stat-label">Total Nodes</div></div>
          <div className="kg-stat-card"><div className="kg-stat-value">{graph.statistics?.total_edges ?? graph.edges.length}</div><div className="kg-stat-label">Total Relationships</div></div>
          <div className="kg-stat-card"><div className="kg-stat-value">{graph.statistics?.modules ?? graph.nodes.filter((n) => n.type === 'module').length}</div><div className="kg-stat-label">Modules</div></div>
          <div className="kg-stat-card"><div className="kg-stat-value">{graph.statistics?.documents ?? graph.nodes.filter((n) => n.type === 'document').length}</div><div className="kg-stat-label">Documents Linked</div></div>
        </motion.div>
      )}

      {loading && (<div className="kg-state"><div className="kg-loader" /><p>Loading knowledge graph…</p></div>)}
      {!loading && error === 'no-project' && (<div className="kg-state"><Box size={40} /><h3>No project selected</h3><p>Select or create a project to view its knowledge graph.</p></div>)}
      {!loading && error === 'failed' && (<div className="kg-state"><Box size={40} /><h3>Unable to load graph</h3><p>Check your connection or backend availability, then retry.</p><button type="button" className="kg-btn kg-btn-primary" onClick={fetchGraph}>Retry</button></div>)}
      {!loading && !error && graph && graph.nodes.length === 0 && (<div className="kg-state"><Box size={40} /><h3>No graph data yet</h3><p>Project knowledge has not been indexed. Connect sources in Knowledge Sources, then refresh.</p><button type="button" className="kg-btn kg-btn-primary" onClick={() => navigate('/knowledge')}>Go to Knowledge Sources</button></div>)}

      {!loading && !error && graph && graph.nodes.length > 0 && (
        <div className="kg-main">
          <div className="kg-toolbar">
            <div className="kg-search-wrap">
              <Search size={14} />
              <input className="kg-search" placeholder="Search nodes…" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => searchResults.length && setShowSearchResults(true)} onBlur={() => setTimeout(() => setShowSearchResults(false), 150)} />
              {search && (<button type="button" className="kg-icon-btn" onClick={() => { setSearch(''); setSearchResults([]); }} aria-label="Clear search"><X size={13} /></button>)}
              {showSearchResults && searchResults.length > 0 && (
                <div className="kg-search-results">
                  {searchResults.slice(0, 8).map((n) => (
                    <button key={n.id} type="button" className="kg-search-result" onClick={() => focusNode(n.id)}>
                      <span className="kg-result-dot" style={{ background: NODE_TYPE_META[n.type]?.color || '#94A3B8' }} />
                      <span>{n.label}</span>
                      <span className="kg-result-type">{n.type}</span>
                    </button>
                  ))}
                </div>
              )}
              {search && searchResults.length === 0 && (<div className="kg-search-results"><div className="kg-no-results">No matching nodes</div></div>)}
            </div>

            <div className="kg-filter-group">
              <Filter size={13} />
              <select className="kg-select" value={nodeTypeFilter} onChange={(e) => setNodeTypeFilter(e.target.value)}>
                <option value="all">All node types</option>
                {nodeTypesPresent.map((t) => (<option key={t} value={t}>{NODE_TYPE_META[t]?.label || t}</option>))}
              </select>
              <select className="kg-select" value={edgeTypeFilter} onChange={(e) => setEdgeTypeFilter(e.target.value)}>
                <option value="all">All relationships</option>
                {edgeTypesPresent.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>

            <div className="kg-zoom-group">
              <button type="button" className="kg-icon-btn" onClick={zoomIn} aria-label="Zoom in"><ZoomIn size={14} /></button>
              <button type="button" className="kg-icon-btn" onClick={zoomOut} aria-label="Zoom out"><ZoomOut size={14} /></button>
              <button type="button" className="kg-icon-btn" onClick={fitToScreen} aria-label="Fit to screen"><Maximize2 size={14} /></button>
              <button type="button" className="kg-icon-btn" onClick={resetView} aria-label="Reset view"><RotateCcw size={14} /></button>
            </div>
          </div>

          <div className="kg-content">
            <div className="kg-canvas" ref={containerRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}>
              <div className="graph-bg" />
              <div className="kg-transform" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
                <svg className="kg-edges" width="1" height="1" style={{ overflow: 'visible' }}>
                  {visibleEdges.map((e) => {
                    const s = positions[e.source]; const t = positions[e.target];
                    if (!s || !t) return null;
                    const highlighted = highlightSet && highlightSet.has(e.source) && highlightSet.has(e.target);
                    const dimmed = highlightSet && !(highlightSet.has(e.source) && highlightSet.has(e.target));
                    return (
                      <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                        className={`kg-edge ${highlighted ? 'highlighted' : ''} ${dimmed ? 'dimmed' : ''}`}
                        onClick={() => { setSelectedId(e.source); }} />
                    );
                  })}
                </svg>
                {visibleNodes.map((n) => {
                  const p = positions[n.id]; if (!p) return null;
                  const meta = NODE_TYPE_META[n.type] || NODE_TYPE_META.module;
                  const Icon = meta.icon;
                  const isSel = selectedId === n.id;
                  const dimmed = highlightSet && !highlightSet.has(n.id);
                  return (
                    <div key={n.id} className={`kg-node ${isSel ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}
                      style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`, '--node-color': meta.color }}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
                      onMouseEnter={() => setHoveredId(n.id)} onMouseLeave={() => setHoveredId(null)}>
                      <div className="kg-node-icon"><Icon size={14} /></div>
                      <div className="kg-node-label">{n.label}</div>
                    </div>
                  );
                })}
              </div>

              {hoveredId && positions[hoveredId] && (
                <div className="kg-tooltip" style={{ left: `calc(50% + ${positions[hoveredId].x * transform.scale + transform.x}px + 14px)`, top: `calc(50% + ${positions[hoveredId].y * transform.scale + transform.y}px - 10px)` }}>
                  <div className="kg-tooltip-title">{graph.nodes.find((n) => n.id === hoveredId)?.label}</div>
                  <div className="kg-tooltip-sub">{graph.nodes.find((n) => n.id === hoveredId)?.type}</div>
                </div>
              )}
            </div>

            <div className="kg-legend">
              <div className="kg-legend-title">Legend</div>
              {nodeTypesPresent.map((t) => {
                const meta = NODE_TYPE_META[t]; if (!meta) return null;
                const Icon = meta.icon;
                return (<div key={t} className="kg-legend-item"><span className="kg-legend-dot" style={{ background: meta.color }} /><Icon size={12} /><span>{meta.label}</span></div>);
              })}
            </div>

            <aside className="kg-details">
              {!selectedNode ? (
                <div className="kg-details-empty"><Box size={28} /><p>Select a node to view details.</p></div>
              ) : (
                <motion.div key={selectedNode.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                  <div className="kg-details-header">
                    <span className="kg-details-type" style={{ color: NODE_TYPE_META[selectedNode.type]?.color }}>{selectedNode.type}</span>
                    <button type="button" className="kg-icon-btn" onClick={() => setSelectedId(null)} aria-label="Close details"><X size={13} /></button>
                  </div>
                  <h3 className="kg-details-title">{selectedNode.label}</h3>
                  {selectedNode.description && <p className="kg-details-desc">{selectedNode.description}</p>}

                  {selectedNode.metadata?.path && (<div className="kg-detail-field"><span className="kg-detail-field-label">Path</span><span className="kg-detail-field-value">{selectedNode.metadata.path}</span></div>)}
                  {selectedNode.metadata?.module && (<div className="kg-detail-field"><span className="kg-detail-field-label">Module</span><span className="kg-detail-field-value">{selectedNode.metadata.module}</span></div>)}
                  {selectedNode.metadata?.file && (<div className="kg-detail-field"><span className="kg-detail-field-label">File</span><span className="kg-detail-field-value">{selectedNode.metadata.file}</span></div>)}
                  {selectedNode.metadata?.hash && (<div className="kg-detail-field"><span className="kg-detail-field-label">Hash</span><span className="kg-detail-field-value">{selectedNode.metadata.hash}</span></div>)}

                  <div className="kg-relations">
                    <div className="kg-relations-title">Incoming</div>
                    {graph.edges.filter((e) => e.target === selectedNode.id).length === 0 && <div className="kg-relations-empty">None</div>}
                    {graph.edges.filter((e) => e.target === selectedNode.id).map((e) => {
                      const src = graph.nodes.find((n) => n.id === e.source);
                      return (<button key={e.id} type="button" className="kg-relation-btn" onClick={() => setSelectedId(e.source)}>{src?.label || e.source} <span className="kg-relation-type">{e.type}</span></button>);
                    })}
                  </div>

                  <div className="kg-relations">
                    <div className="kg-relations-title">Outgoing</div>
                    {graph.edges.filter((e) => e.source === selectedNode.id).length === 0 && <div className="kg-relations-empty">None</div>}
                    {graph.edges.filter((e) => e.source === selectedNode.id).map((e) => {
                      const tgt = graph.nodes.find((n) => n.id === e.target);
                      return (<button key={e.id} type="button" className="kg-relation-btn" onClick={() => setSelectedId(e.target)}>{tgt?.label || e.target} <span className="kg-relation-type">{e.type}</span></button>);
                    })}
                  </div>

                  <div className="kg-related">
                    <div className="kg-relations-title">Neighbors</div>
                    <div className="kg-neighbor-chips">
                      {[...(adjacency.get(selectedNode.id) || [])].map((nid) => {
                        const n = graph.nodes.find((x) => x.id === nid);
                        return (<button key={nid} type="button" className="kg-chip" onClick={() => setSelectedId(nid)}>{n?.label || nid}</button>);
                      })}
                      {(!adjacency.get(selectedNode.id) || adjacency.get(selectedNode.id).size === 0) && (<div className="kg-relations-empty">None</div>)}
                    </div>
                  </div>

                  <button type="button" className="kg-btn kg-btn-primary kg-ask-btn" onClick={askAI}>Ask AI about this <ArrowRight size={13} /></button>
                </motion.div>
              )}
            </aside>
          </div>

          {graph.demo && (<div className="kg-demo-note">Preview data — backend graph endpoint not connected. Showing a representative sample.</div>)}
        </div>
      )}
    </motion.div>
  );
}

