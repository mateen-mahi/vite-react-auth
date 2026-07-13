// src/components/admin/QuizTable.jsx
import { useState, useMemo } from "react";
import { FiSearch, FiAlertTriangle } from "react-icons/fi";
import { DUMMY_QUIZZES, DUMMY_COURSES } from "../../data/dummyAdminData";
import Pagination from "./Pagination";

const PAGE_SIZE = 8;

export default function QuizTable() {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = DUMMY_QUIZZES; // TODO: fetch from GET /quizzes
    if (search) list = list.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()));
    if (courseFilter !== "All") list = list.filter((q) => q.courseId === courseFilter);
    return list;
  }, [search, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2 className="admin-panel-title">Quiz Management</h2>
        <span className="admin-panel-count">{filtered.length} quizzes</span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <FiSearch className="admin-search-icon" />
          <input
            className="admin-search"
            placeholder="Search quizzes…"
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
            <tr><th>Quiz</th><th>Course</th><th>Questions</th><th>Avg Score</th><th>Pass Rate</th><th>Avg Time / Est.</th></tr>
          </thead>
          <tbody>
            {pageItems.map((q) => (
              <tr key={q._id}>
                <td className="admin-cell-primary">{q.title}</td>
                <td className="admin-cell-secondary">{q.courseTitle}</td>
                <td className="admin-cell-secondary">{q.questionCount}</td>
                <td>
                  <span className={`admin-status-badge ${q.avgScore >= 60 ? "verified" : "unverified"}`}>
                    {q.avgScore}%
                  </span>
                </td>
                <td className="admin-cell-secondary">{q.passRate}%</td>
                <td className="admin-cell-secondary">
                  {q.avgTimeTaken}m / {q.totalTime}m
                  {q.avgTimeTaken > q.totalTime && (
                    <FiAlertTriangle style={{ marginLeft: 6, color: "#d97706" }} title="Over estimate" />
                  )}
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
