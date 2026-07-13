// src/components/admin/LectureTable.jsx
import { useState, useMemo } from "react";
import { FiSearch, FiEdit2, FiTrash2, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { DUMMY_LECTURES, DUMMY_COURSES } from "../../data/dummyAdminData";
import Pagination from "./Pagination";

const PAGE_SIZE = 8;

export default function LectureTable() {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = DUMMY_LECTURES; // TODO: fetch from GET /lectures
    if (search) list = list.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()));
    if (courseFilter !== "All") list = list.filter((l) => l.courseId === courseFilter);
    return list;
  }, [search, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Lecture Management</h2>
        <span className="admin-panel-count">{filtered.length} lectures</span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FiSearch className="admin-search-icon" />
          <input
            className="admin-search"
            placeholder="Search lectures…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="admin-select" value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}>
          <option value="All">All Courses</option>
          {DUMMY_COURSES.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Lecture</th><th>Course</th><th>Duration</th><th>Video Status</th><th></th></tr>
          </thead>
          <tbody>
            {pageItems.map((l) => (
              <tr key={l._id}>
                <td className="admin-cell-primary">{l.title}</td>
                <td className="admin-cell-secondary">{l.courseTitle}</td>
                <td className="admin-cell-secondary">{l.duration}m</td>
                <td>
                  {l.videoStatus === "ok"
                    ? <span className="admin-status-badge verified"><FiCheckCircle /> OK</span>
                    : <span className="admin-flag-badge"><FiAlertTriangle /> Broken</span>}
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button title="Edit"><FiEdit2 /></button>
                    <button title="Delete"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
