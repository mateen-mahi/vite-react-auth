import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  FiSearch, FiClock, FiBarChart2, FiUser,
  FiPlay, FiBookOpen, FiAward, FiCheckCircle,
  FiRefreshCw, FiAlertCircle, FiX, FiUserPlus, FiUserMinus,
} from "react-icons/fi";
import "../styles/courses.css";

const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const SORT_OPTIONS = [
  { value: "popular",     label: "Most Popular" },
  { value: "newest",      label: "Newest" },
  { value: "price-low",   label: "Price: Low to High" },
  { value: "price-high",  label: "Price: High to Low" },
];

const LEVEL_COLOR = {
  Beginner:     { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Intermediate: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Advanced:     { bg: "#fff5f5", color: "#ef4444", border: "#fecaca" },
};

// ── Helpers ──────────────────────────────────────────────
// Assumes `duration` is stored in MINUTES — confirm this matches your schema
const formatDuration = (mins) => {
  if (mins === undefined || mins === null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatPrice = (price) => (price === 0 ? "Free" : `$${price}`);

// TEMPORARY — deterministic dummy progress per course (stable across
// re-renders, not random noise) until real LectureProgress tracking exists.
// Swap this out entirely once that backend is built.
const getDummyProgress = (id) => {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 97;
  }
  return hash % 96; // keeps it in a believable 0–95 range
};

// ── Lightweight toast (inline-styled, no external CSS dependency) ──
function Toast({ msg, onClose }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, background: "#0f172a", color: "#fff",
      padding: "12px 16px", borderRadius: 10, display: "flex", alignItems: "center",
      gap: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", zIndex: 1000, fontSize: 14,
    }}>
      <FiCheckCircle />
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}>
        <FiX />
      </button>
    </div>
  );
}

export default function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user);

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState(null);

  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const [enrollingId, setEnrollingId] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── Fetch real data — works for guests too (optionalAuth on the backend) ──
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      setCoursesError(null);
      try {
        const res = await api.get("/courses");
        setCourses(res.data.data);
      } catch (err) {
        console.log("Failed to fetch courses:", err);
        setCoursesError("Couldn't load courses. Please try again.");
      } finally {
        setLoadingCourses(false);
      }
    };

    const fetchFeatured = async () => {
      setLoadingFeatured(true);
      try {
        const res = await api.get("/courses/featured");
        setFeaturedCourses(res.data.data);
      } catch (err) {
        console.log("Failed to fetch featured courses:", err);
        // Non-fatal — the page still works without the hero banner
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchCourses();
    fetchFeatured();
  }, [isLoggedIn]); // refetch after login/logout so isEnrolled reflects the right user

  // ── Filters ──
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [level,    setLevel]    = useState("All Levels");
  const [sort,     setSort]     = useState("popular");

  // Categories come from real data instead of a hardcoded guess
  const CATEGORIES = useMemo(() => {
    const unique = [...new Set(courses.map((c) => c.category))];
    return ["All", ...unique];
  }, [courses]);

  const featuredIds = useMemo(() => new Set(featuredCourses.map((c) => c._id)), [featuredCourses]);
  const hero = featuredCourses[0];

  // Split: enrolled (only meaningful when logged in) vs everything else,
  // excluding whatever's already shown in the hero banner above.
  const enrolledCourses = useMemo(
    () => (isLoggedIn ? courses.filter((c) => c.studentsEnrolled.includes(user._id) && !featuredIds.has(c._id)) : []),
    [courses, isLoggedIn, featuredIds]
  );

  const browsablePool = useMemo(
    () => courses.filter((c) => !featuredIds.has(c._id) && !(isLoggedIn && c.studentsEnrolled.includes(user._id))),
    [courses, isLoggedIn, featuredIds]
  );

  const filtered = useMemo(() => {
    let list = browsablePool;

    if (search) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.instructor?.username?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category !== "All") list = list.filter((c) => c.category === category);
    if (level !== "All Levels") list = list.filter((c) => c.level === level);

    list = [...list].sort((a, b) => {
      if (sort === "popular")    return (b.studentsEnrolledCount || 0) - (a.studentsEnrolledCount || 0);
      if (sort === "price-low")  return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

    return list;
  }, [browsablePool, search, category, level, sort]);

  // ── Enroll / Unenroll ──
  const handleEnroll = async (courseId) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setEnrollingId(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId
            ? { ...c, isEnrolled: true, studentsEnrolledCount: (c.studentsEnrolledCount || 0) + 1 }
            : c
        )
      );
      showToast("Enrolled successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to enroll. Please try again.");
    } finally {
      setEnrollingId(null);
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!window.confirm("Unenroll from this course?")) return;
    setEnrollingId(courseId);
    try {
      await api.post(`/courses/${courseId}/unenroll`);
      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId
            ? { ...c, isEnrolled: false, studentsEnrolledCount: Math.max(0, (c.studentsEnrolledCount || 1) - 1) }
            : c
        )
      );
      showToast("Unenrolled.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unenroll.");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="courses-page">

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── Page Header ── */}
      <div className="courses-header">
        <div>
          <h1 className="courses-title">{isLoggedIn ? "My Courses" : "All Courses"}</h1>
          <p className="courses-subtitle">
            {isLoggedIn
              ? `${enrolledCourses.length} course${enrolledCourses.length !== 1 ? "s" : ""} enrolled — keep learning.`
              : "Browse our full course catalog. Log in to enroll and track progress."}
          </p>
        </div>
      </div>

      {/* ── Featured hero ── */}
      {!loadingFeatured && hero && (
        <div className="courses-featured" style={{ "--fc": hero.color }}>
          <div className="courses-featured-left">
            <span className="courses-featured-tag"><FiAward /> Featured Course</span>
            <h2 className="courses-featured-title">{hero.title}</h2>
            <p className="courses-featured-desc">{hero.description}</p>
            <div className="courses-featured-meta">
              <span><FiUser /> {hero.instructor?.username || "Unknown instructor"}</span>
              <span><FiClock /> {formatDuration(hero.duration)}</span>
              <span><FiBookOpen /> {hero.lessonsCount} lessons</span>
              <span>{formatPrice(hero.price)}</span>
            </div>

            {hero.studentsEnrolled.includes(user._id) ? (
              <>
                {/* Real percentage needs a LectureProgress backend — not built yet, see chat note */}
                <div className="courses-featured-progress-wrap">
                  <div className="courses-featured-progress-label">
                    <span>Progress</span>
                    <span>Not started yet</span>
                  </div>
                  <div className="courses-featured-progress-track">
                    <div className="courses-featured-progress-fill" style={{ width: "0%" }} />
                  </div>
                </div>
                <button className="courses-featured-btn">
                  <FiPlay /> Continue Learning
                </button>
              </>
            ) : (
              <button
                className="courses-featured-btn"
                disabled={enrollingId === hero._id}
                onClick={() => handleEnroll(hero._id)}
              >
                {enrollingId === hero._id
                  ? <><FiRefreshCw className="cp-spin" /> Enrolling…</>
                  : <><FiUserPlus /> {isLoggedIn ? "Enroll Now" : "Log In to Enroll"}</>}
              </button>
            )}
          </div>
          <div className="courses-featured-right">
            <div className="courses-featured-emoji">{hero.emoji}</div>
          </div>
        </div>
      )}

      {/* ── Continue Learning (logged-in, enrolled only) ── */}
      {isLoggedIn && enrolledCourses.length > 0 && (
        <>
          <h2 className="courses-count" style={{ fontWeight: 700, fontSize: 16 }}>Continue Learning</h2>
          <div className="courses-grid">
            {enrolledCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isLoggedIn={isLoggedIn}
                enrolling={enrollingId === course._id}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Filters ── */}
      <div className="courses-filters">
        <div className="courses-search-wrap">
          <FiSearch className="courses-search-icon" />
          <input
            className="courses-search"
            placeholder="Search courses or instructors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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

        <div className="courses-selects">
          <select className="courses-select" value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select className="courses-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Explore grid ── */}
      <h2 className="courses-count" style={{ fontWeight: 700, fontSize: 16 }}>
        {isLoggedIn ? "Explore More Courses" : "All Courses"}
      </h2>

      {loadingCourses && (
        <p className="courses-count"><FiRefreshCw className="cp-spin" /> Loading courses…</p>
      )}

      {!loadingCourses && coursesError && (
        <p className="courses-count"><FiAlertCircle /> {coursesError}</p>
      )}

      {!loadingCourses && !coursesError && (
        <>
          <p className="courses-count">
            {filtered.length === 0
              ? "No courses match your filters."
              : `${filtered.length} course${filtered.length !== 1 ? "s" : ""}`}
          </p>

          <div className="courses-grid">
            {filtered.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isLoggedIn={isLoggedIn}
                enrolling={enrollingId === course._id}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Course card ─────────────────────────────────────────────
function CourseCard({ course, isLoggedIn, enrolling, onEnroll, onUnenroll }) {
  const lvlStyle = LEVEL_COLOR[course.level] || LEVEL_COLOR.Beginner;

  return (
    <div className="course-card">
      <div
        className="course-card-thumb"
        style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}44)`, borderBottom: `3px solid ${course.color}` }}
      >
        <span className="course-card-emoji">{course.emoji}</span>
        <span
          className="course-card-level"
          style={{ background: lvlStyle.bg, color: lvlStyle.color, border: `1px solid ${lvlStyle.border}` }}
        >
          <FiBarChart2 /> {course.level}
        </span>
      </div>

      <div className="course-card-body">
        <span className="course-card-category" style={{ color: course.color }}>{course.category}</span>
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-instructor"><FiUser /> {course.instructor?.username || "Unknown instructor"}</p>

        <div className="course-card-meta">
          <span><FiClock /> {formatDuration(course.duration)}</span>
          <span><FiBookOpen /> {course.lessonsCount} lessons</span>
          <span>{formatPrice(course.price)}</span>
        </div>

        {course.isEnrolled && (
          // Placeholder until real LectureProgress tracking exists
          <div className="course-card-progress">
            <div className="course-card-progress-label">
              <span className="cp-tag in-progress"><FiCheckCircle /> Enrolled</span>
            </div>
            <div className="course-card-progress-track">
              <div className="course-card-progress-fill" style={{ width: "0%", background: course.color }} />
            </div>
          </div>
        )}
      </div>

      <div className="course-card-footer">
        <span className="course-card-students">{(course.studentsEnrolledCount || 0).toLocaleString()} students</span>

        {course.isEnrolled ? (
          <button
            className="course-card-btn"
            style={{ background: "#64748b" }}
            disabled={enrolling}
            onClick={() => onUnenroll(course._id)}
          >
            {enrolling ? <FiRefreshCw className="cp-spin" /> : <><FiUserMinus /> Unenroll</>}
          </button>
        ) : (
          <button
            className="course-card-btn"
            style={{ background: course.color }}
            disabled={enrolling}
            onClick={() => onEnroll(course._id)}
          >
            {enrolling
              ? <FiRefreshCw className="cp-spin" />
              : <>{isLoggedIn ? "Enroll" : "Log In"} <FiPlay /></>}
          </button>
        )}
      </div>
    </div>
  );
}