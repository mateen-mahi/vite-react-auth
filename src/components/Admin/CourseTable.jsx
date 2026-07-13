// src/components/admin/CourseTable.jsx
import { useState, useMemo } from "react";
import { FiSearch, FiStar, FiTrash2, FiEdit2, FiAlertTriangle } from "react-icons/fi";
import { DUMMY_COURSES } from "../../data/dummyAdminData";
import Pagination from "./Pagination";

const PAGE_SIZE = 8;

// Flags courses that break the "10-15 lectures, at least 1 quiz" rule from
// the admin guide's data-quality checks (Section 4).
const isDataFlagged = (c) => c.lecturesCount < 10 || c.lecturesCount > 15 || c.quizzesCount === 0;

export default function CourseTable() {
  const [courses, setCourses] = useState(DUMMY_COURSES); // TODO: fetch from GET /courses
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All Levels");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => ["All", ...new Set(DUMMY_COURSES.map((c) => c.category))], []);

  const filtered = useMemo(() => {
    let list = courses;
    if (search) list = list.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== "All") list = list.filter((c) => c.category === category);
    if (level !== "All Levels") list = list.filter((c) => c.level === level);
    return list;
  }, [courses, search, category, level]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // TODO: wire to PATCH /courses/:id { featured }
  const toggleFeatured = (id) =>
    setCourses((prev) => prev.map((c) => (c._id === id ? { ...c, featured: !c.featured } : c)));

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Course Management</h2>
        <span className="admin-panel-count">{filtered.length} courses</span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FiSearch className="admin-search-icon" />
          <input
            className="admin-search"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="admin-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="admin-select" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
          {["All Levels", "Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Course</th><th>Category / Level</th><th>Students</th><th>Revenue</th><th>Data Quality</th><th>Featured</th><th></th></tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <tr key={c._id}>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar-sm" style={{ background: c.color }}>{c.emoji}</div>
                    <div>
                      <p className="admin-cell-primary">{c.title}</p>
                      <p className="admin-cell-secondary">by {c.instructor}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p className="admin-cell-primary">{c.category}</p>
                  <p className="admin-cell-secondary">{c.level}</p>
                </td>
                <td className="admin-cell-primary">{c.studentsEnrolledCount.toLocaleString()}</td>
                <td className="admin-cell-primary">
                  ${(c.price * c.studentsEnrolledCount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td>
                  {isDataFlagged(c)
                    ? <span className="admin-flag-badge"><FiAlertTriangle /> Review</span>
                    : <span className="admin-status-badge verified">OK</span>}
                </td>
                <td>
                  <button
                    className={`admin-toggle ${c.featured ? "on" : ""}`}
                    onClick={() => toggleFeatured(c._id)}
                    title="Toggle featured"
                  >
                    <FiStar />
                  </button>
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
