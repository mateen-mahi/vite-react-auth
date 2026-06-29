import { useState, useMemo } from "react";
import {
  FiSearch, FiClock, FiBarChart2, FiUser,
  FiPlay, FiBookOpen, FiStar, FiAward,
} from "react-icons/fi";
import "../styles/courses.css";

// ─── Dummy Data ────────────────────────────────────────────
const COURSES = [
  {
    id: 1,
    title: "Complete React Developer",
    instructor: "Irfan Malik",
    category: "Frontend",
    level: "Intermediate",
    duration: "24h 30m",
    lessons: 142,
    rating: 4.9,
    students: 8420,
    progress: 68,
    featured: true,
    color: "#2563eb",
    emoji: "⚛️",
    description: "Master React from scratch — hooks, routing, state management, performance optimization, and real-world project architecture.",
  },
  {
    id: 2,
    title: "Node.js & Express Bootcamp",
    instructor: "Sara Ahmed",
    category: "Backend",
    level: "Intermediate",
    duration: "18h 15m",
    lessons: 98,
    rating: 4.8,
    students: 5310,
    progress: 40,
    featured: false,
    color: "#16a34a",
    emoji: "🟢",
    description: "Build scalable REST APIs with Node.js, Express, JWT auth, file uploads, and deploy to production.",
  },
  {
    id: 3,
    title: "MongoDB — The Complete Guide",
    instructor: "Ali Raza",
    category: "Database",
    level: "Beginner",
    duration: "12h 45m",
    lessons: 74,
    rating: 4.7,
    students: 3890,
    progress: 20,
    featured: false,
    color: "#059669",
    emoji: "🍃",
    description: "Learn MongoDB from the ground up — schema design, Mongoose, aggregation pipelines, and indexing strategies.",
  },
  {
    id: 4,
    title: "JavaScript Algorithms & DSA",
    instructor: "Usman Tariq",
    category: "Core CS",
    level: "Advanced",
    duration: "30h 00m",
    lessons: 180,
    rating: 4.9,
    students: 12100,
    progress: 55,
    featured: false,
    color: "#d97706",
    emoji: "🧠",
    description: "Deep dive into data structures and algorithms using JavaScript — arrays, trees, graphs, sorting, and dynamic programming.",
  },
  {
    id: 5,
    title: "CSS Mastery & Modern Layouts",
    instructor: "Hina Baig",
    category: "Frontend",
    level: "Beginner",
    duration: "10h 20m",
    lessons: 62,
    rating: 4.6,
    students: 4750,
    progress: 90,
    featured: false,
    color: "#7c3aed",
    emoji: "🎨",
    description: "From Flexbox to CSS Grid, animations, custom properties, and building pixel-perfect responsive UIs.",
  },
  {
    id: 6,
    title: "System Design for Developers",
    instructor: "Bilal Hassan",
    category: "Core CS",
    level: "Advanced",
    duration: "22h 10m",
    lessons: 115,
    rating: 4.8,
    students: 6200,
    progress: 0,
    featured: false,
    color: "#0891b2",
    emoji: "🏗️",
    description: "Learn how to design scalable, fault-tolerant systems — load balancing, caching, databases, and microservices.",
  },
  {
    id: 7,
    title: "TypeScript from Zero to Hero",
    instructor: "Zara Khan",
    category: "Frontend",
    level: "Intermediate",
    duration: "15h 30m",
    lessons: 88,
    rating: 4.7,
    students: 3100,
    progress: 10,
    featured: false,
    color: "#1d4ed8",
    emoji: "🔷",
    description: "Master TypeScript — types, interfaces, generics, decorators, and integrating TS with React and Node projects.",
  },
  {
    id: 8,
    title: "Git & GitHub for Developers",
    instructor: "Hamza Siddiq",
    category: "Tools",
    level: "Beginner",
    duration: "6h 00m",
    lessons: 38,
    rating: 4.5,
    students: 9800,
    progress: 100,
    featured: false,
    color: "#be185d",
    emoji: "🐙",
    description: "Everything you need to know about version control — branching strategies, pull requests, resolving conflicts, and CI/CD.",
  },
];

const CATEGORIES = ["All", "Frontend", "Backend", "Database", "Core CS", "Tools"];
const LEVELS     = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const SORT_OPTIONS = [
  { value: "popular",  label: "Most Popular" },
  { value: "rating",   label: "Top Rated" },
  { value: "newest",   label: "Newest" },
  { value: "progress", label: "In Progress" },
];

const LEVEL_COLOR = {
  Beginner:     { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Intermediate: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Advanced:     { bg: "#fff5f5", color: "#ef4444", border: "#fecaca" },
};

export default function Courses() {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [level,    setLevel]    = useState("All Levels");
  const [sort,     setSort]     = useState("popular");

  const featured = COURSES.find((c) => c.featured);

  const filtered = useMemo(() => {
    let list = COURSES.filter((c) => !c.featured);

    if (search)           list = list.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase()));
    if (category !== "All")        list = list.filter((c) => c.category === category);
    if (level !== "All Levels")    list = list.filter((c) => c.level === level);

    list = [...list].sort((a, b) => {
      if (sort === "popular")  return b.students - a.students;
      if (sort === "rating")   return b.rating - a.rating;
      if (sort === "progress") return b.progress - a.progress;
      return b.id - a.id; // newest
    });

    return list;
  }, [search, category, level, sort]);

  return (
    <div className="courses-page">

      {/* ── Page Header ── */}
      <div className="courses-header">
        <div>
          <h1 className="courses-title">My Courses</h1>
          <p className="courses-subtitle">{COURSES.length} courses enrolled — keep learning.</p>
        </div>
        <div className="courses-header-stats">
          <div className="courses-hstat">
            <span className="courses-hstat-val">{COURSES.filter(c => c.progress === 100).length}</span>
            <span className="courses-hstat-label">Completed</span>
          </div>
          <div className="courses-hstat">
            <span className="courses-hstat-val">{COURSES.filter(c => c.progress > 0 && c.progress < 100).length}</span>
            <span className="courses-hstat-label">In Progress</span>
          </div>
          <div className="courses-hstat">
            <span className="courses-hstat-val">{COURSES.filter(c => c.progress === 0).length}</span>
            <span className="courses-hstat-label">Not Started</span>
          </div>
        </div>
      </div>

      {/* ── Featured Course ── */}
      {featured && (
        <div className="courses-featured" style={{ "--fc": featured.color }}>
          <div className="courses-featured-left">
            <span className="courses-featured-tag"><FiAward /> Featured Course</span>
            <h2 className="courses-featured-title">{featured.title}</h2>
            <p className="courses-featured-desc">{featured.description}</p>
            <div className="courses-featured-meta">
              <span><FiUser /> {featured.instructor}</span>
              <span><FiClock /> {featured.duration}</span>
              <span><FiBookOpen /> {featured.lessons} lessons</span>
              <span><FiStar /> {featured.rating}</span>
            </div>
            <div className="courses-featured-progress-wrap">
              <div className="courses-featured-progress-label">
                <span>Progress</span>
                <span>{featured.progress}%</span>
              </div>
              <div className="courses-featured-progress-track">
                <div className="courses-featured-progress-fill" style={{ width: `${featured.progress}%` }} />
              </div>
            </div>
            <button className="courses-featured-btn">
              <FiPlay /> Continue Learning
            </button>
          </div>
          <div className="courses-featured-right">
            <div className="courses-featured-emoji">{featured.emoji}</div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="courses-filters">
        {/* Search */}
        <div className="courses-search-wrap">
          <FiSearch className="courses-search-icon" />
          <input
            className="courses-search"
            placeholder="Search courses or instructors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category pills */}
        <div className="courses-category-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`courses-pill ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Level + Sort */}
        <div className="courses-selects">
          <select
            className="courses-select"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select
            className="courses-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Results count ── */}
      <p className="courses-count">
        {filtered.length === 0
          ? "No courses match your filters."
          : `${filtered.length} course${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* ── Grid ── */}
      <div className="courses-grid">
        {filtered.map((course) => {
          const lvlStyle = LEVEL_COLOR[course.level];
          return (
            <div key={course.id} className="course-card">

              {/* Thumbnail */}
              <div className="course-card-thumb" style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}44)`, borderBottom: `3px solid ${course.color}` }}>
                <span className="course-card-emoji">{course.emoji}</span>
                <span
                  className="course-card-level"
                  style={{ background: lvlStyle.bg, color: lvlStyle.color, border: `1px solid ${lvlStyle.border}` }}
                >
                  <FiBarChart2 /> {course.level}
                </span>
              </div>

              {/* Body */}
              <div className="course-card-body">
                <span className="course-card-category" style={{ color: course.color }}>{course.category}</span>
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-instructor"><FiUser /> {course.instructor}</p>

                <div className="course-card-meta">
                  <span><FiClock /> {course.duration}</span>
                  <span><FiBookOpen /> {course.lessons} lessons</span>
                  <span><FiStar /> {course.rating}</span>
                </div>

                {/* Progress bar */}
                <div className="course-card-progress">
                  <div className="course-card-progress-label">
                    {course.progress === 0   && <span className="cp-tag not-started">Not started</span>}
                    {course.progress === 100 && <span className="cp-tag completed"><FiAward /> Completed</span>}
                    {course.progress > 0 && course.progress < 100 && <span className="cp-tag in-progress">In progress</span>}
                    <span className="cp-pct">{course.progress}%</span>
                  </div>
                  <div className="course-card-progress-track">
                    <div
                      className={`course-card-progress-fill ${course.progress === 100 ? "done" : ""}`}
                      style={{ width: `${course.progress}%`, background: course.progress === 100 ? "#22c55e" : course.color }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="course-card-footer">
                <span className="course-card-students">{course.students.toLocaleString()} students</span>
                <button className="course-card-btn" style={{ background: course.color }}>
                  {course.progress === 0 ? "Start" : course.progress === 100 ? "Review" : "Continue"}
                  <FiPlay />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}