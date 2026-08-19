import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useApiList from "../custom-hooks/useApiList.js";
import Pagination from "../components/shared/Pagination";
import {
  FiSearch, FiClock, FiBarChart2, FiUser,
  FiPlay, FiBookOpen, FiAward, FiCheckCircle,
  FiRefreshCw, FiAlertCircle, FiX, FiShoppingCart,
  FiShuffle, FiTrash2, FiUserMinus,
} from "react-icons/fi";
import "../styles/courses.css";

const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];

// UI sort labels -> real API sortBy/order pairs (GET /api/courses only
// whitelists title|price|duration|level|category|createdAt for sortBy).
// There's no "enrollment count" field in that whitelist, so "Most Popular"
// falls back to the endpoint's own default (createdAt desc) rather than
// silently pretending to sort by popularity.
const SORT_OPTIONS = [
  { value: "popular",     label: "Most Popular",      sortBy: "createdAt", order: "desc" },
  { value: "newest",      label: "Newest",             sortBy: "createdAt", order: "desc" },
  { value: "price-low",   label: "Price: Low to High", sortBy: "price",     order: "asc" },
  { value: "price-high",  label: "Price: High to Low", sortBy: "price",     order: "desc" },
];

const LEVEL_COLOR = {
  Beginner:     { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Intermediate: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Advanced:     { bg: "#fff5f5", color: "#ef4444", border: "#fecaca" },
};

const CART_STORAGE_KEY = "academy_course_cart";
const PAGE_SIZE = 9;

// ── Helpers ──────────────────────────────────────────────
const formatPrice = (price) => (price === 0 ? "Free" : `$${price}`);

// Progress records come back with courseId either populated (object) or
// raw (string) depending on the endpoint — normalize either shape to an id.
const idOf = (ref) => (ref && typeof ref === "object" ? ref._id : ref);

// ── Lightweight toast ──
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
  const { user, onEvent } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user);
  const userId = user?._id;

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);

  // { [courseId]: overallProgress } — real per-course progress for this student.
  const [progressMap, setProgressMap] = useState({});

  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!userId) {
        setEnrolledCourses([]);
        return;
      }
      setLoadingEnrolled(true);
      try {
        const res = await api.get(`/courses/my-courses/${userId}`);
        setEnrolledCourses(res.data.data || res.data.courses || []);
      } catch (err) {
        console.log("Failed to fetch enrolled courses:", err);
        setEnrolledCourses([]);
      } finally {
        setLoadingEnrolled(false);
      }
    };

    const fetchProgress = async () => {
      if (!userId) {
        setProgressMap({});
        return;
      }
      try {
        const res = await api.get("/progress");
        const list = res.data?.progress || [];
        const map = {};
        list.forEach((p) => {
          map[idOf(p.courseId)] = p.overallProgress || 0;
        });
        setProgressMap(map);
      } catch (err) {
        console.log("Failed to fetch progress:", err);
        setProgressMap({});
      }
    };

    fetchMyCourses();
    fetchProgress();
  }, [userId]);

  // ── Real-time: keep progress bars in sync without a refresh, whether the
  // update came from this tab, another tab, or another device.
  useEffect(() => {
    if (!onEvent) return;

    const offLecture = onEvent("progress:lectureUpdated", (data) => {
      if (data.overallProgress == null) return;
      setProgressMap((prev) => ({ ...prev, [data.courseId]: data.overallProgress }));
    });

    const offQuiz = onEvent("progress:quizAttempted", (data) => {
      if (data.overallProgress == null) return;
      setProgressMap((prev) => ({ ...prev, [data.courseId]: data.overallProgress }));
    });

    const offCompleted = onEvent("course:completed", (data) => {
      setProgressMap((prev) => ({ ...prev, [data.courseId]: 100 }));
    });

    return () => {
      offLecture();
      offQuiz();
      offCompleted();
    };
  }, [onEvent]);

  // ── Cart (localStorage-backed) ──
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price || 0), 0), [cart]);
  const cartHasCourse = (courseId) => cart.some((item) => item._id === courseId);

  const handleAddToCart = (course, e) => {
    e?.stopPropagation();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (cartHasCourse(course._id)) {
      showToast("Already in your cart.");
      return;
    }
    setCart((prev) => [...prev, {
      _id: course._id, title: course.title, price: course.price,
      emoji: course.emoji, color: course.color,
    }]);
    showToast("Added to cart.");
  };

  const handleRemoveFromCart = (courseId) => {
    setCart((prev) => prev.filter((item) => item._id !== courseId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    navigate("/payment-gateway", { state: { courseIds: cart.map((c) => c._id), total: cartTotal } });
  };

  // ── Unenroll (still a direct action, no cart involved) ──
  const [unenrollingId, setUnenrollingId] = useState(null);
  const handleUnenroll = async (courseId, e) => {
    e?.stopPropagation();
    if (!window.confirm("Unenroll from this course?")) return;
    setUnenrollingId(courseId);
    try {
      await api.post(`/courses/${courseId}/unenroll`, { studentId: userId });
      setEnrolledCourses((prev) => prev.filter((c) => c._id !== courseId));
      showToast("Unenrolled.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unenroll.");
    } finally {
      setUnenrollingId(null);
    }
  };

  // ── Explore grid — GET /api/courses, fully server-driven now ──
  // Sortable: title | price | duration | level | category | createdAt
  // Filters:  category, level, search
  const list = useApiList({
    endpoint: "/courses",
    limit: PAGE_SIZE,
    defaultSortBy: "createdAt",
    defaultOrder: "desc",
    initialFilters: { category: "", level: "" },
    parseResponse: (data) => ({ items: data.data, total: data.total, pages: data.pages }),
  });

  const [sort, setSort] = useState("popular");
  useEffect(() => {
    const opt = SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0];
    list.setSortBy(opt.sortBy);
    list.setOrder(opt.order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // Category pills need the FULL set of categories, not just whatever's on
  // the current filtered page — fetched once, independently of the main
  // paginated list above.
  const [categoryOptions, setCategoryOptions] = useState(["All"]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/courses", { params: { limit: 100, sortBy: "category", order: "asc" } });
        const unique = [...new Set((res.data.data || []).map((c) => c.category))].filter(Boolean);
        setCategoryOptions(["All", ...unique]);
      } catch (err) {
        console.log("Failed to fetch categories:", err);
      }
    })();
  }, []);

  // Featured hero fallback (shown to guests / logged-in users with nothing
  // enrolled yet) — GET /api/courses/featured, so it's correct regardless
  // of what page the Explore grid happens to be on.
  const [featuredFallback, setFeaturedFallback] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/courses/featured", { params: { limit: 1 } });
        setFeaturedFallback((res.data.data || [])[0] || null);
      } catch (err) {
        console.log("Failed to fetch featured course:", err);
      }
    })();
  }, []);

  const enrolledIds = useMemo(() => new Set(enrolledCourses.map((c) => c._id)), [enrolledCourses]);

  // Explore grid: guests see everything, logged-in users see everything
  // MINUS what they're already enrolled in. This exclusion is applied to
  // the current server-fetched page (the API has no "excludeEnrolled"
  // filter), so a page can occasionally render slightly fewer than
  // PAGE_SIZE cards for a student enrolled in many courses — a fair
  // trade-off for real server-side pagination on the catalog.
  const filtered = useMemo(
    () => (isLoggedIn ? list.items.filter((c) => !enrolledIds.has(c._id)) : list.items),
    [list.items, isLoggedIn, enrolledIds]
  );

  // ── Hero: shuffles among enrolled courses when logged in; falls back to
  // the actual featured course otherwise ──
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const hasEnrolled = isLoggedIn && enrolledCourses.length > 0;
  const heroCourse = hasEnrolled ? enrolledCourses[spotlightIndex % enrolledCourses.length] : featuredFallback;

  const handleShuffleHero = () => {
    if (enrolledCourses.length <= 1) return;
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * enrolledCourses.length);
    } while (nextIndex === spotlightIndex);
    setSpotlightIndex(nextIndex);
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

        {/* ── Cart button ── */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setCartOpen((p) => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              background: "#2563eb", color: "#fff", border: "none", borderRadius: 10,
              cursor: "pointer", fontWeight: 600, fontSize: 14,
            }}
          >
            <FiShoppingCart /> Cart
            {cart.length > 0 && (
              <span style={{
                background: "#fff", color: "#2563eb", borderRadius: "999px",
                fontSize: 12, fontWeight: 700, padding: "1px 7px",
              }}>
                {cart.length}
              </span>
            )}
          </button>

          {cartOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)", width: 300,
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)", padding: 16, zIndex: 100,
            }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Your Cart</p>

              {cart.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Your cart is empty.</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item._id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{item.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.title}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748b" }}>{formatPrice(item.price)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item._id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex" }}
                        aria-label="Remove from cart"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                    <span>Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    style={{
                      width: "100%", marginTop: 12, padding: "10px 0", background: "#2563eb",
                      color: "#fff", border: "none", borderRadius: 10, fontWeight: 600,
                      fontSize: 14, cursor: "pointer",
                    }}
                  >
                    Proceed to Payment
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Featured / Spotlight hero ── */}
      {heroCourse && (
        <div className="courses-featured" style={{ "--fc": heroCourse.color }}>
          <div className="courses-featured-left">
            <span className="courses-featured-tag">
              <FiAward /> {hasEnrolled ? "Continue Learning" : "Featured Course"}
            </span>
            <h2 className="courses-featured-title">{heroCourse.title}</h2>
            <p className="courses-featured-desc">{heroCourse.description}</p>
            <div className="courses-featured-meta">
              <span><FiUser /> {typeof heroCourse.instructor === "object" ? heroCourse.instructor?.username : "Instructor"}</span>
              <span><FiClock /> {heroCourse.duration}</span>
              <span><FiBookOpen /> {heroCourse.lessonsCount ?? heroCourse.lectures?.length ?? 0} lessons</span>
              <span>{formatPrice(heroCourse.price)}</span>
            </div>

            {hasEnrolled ? (
              <>
                <div className="courses-featured-progress-wrap">
                  <div className="courses-featured-progress-label">
                    <span>Progress</span>
                    <span>{progressMap[heroCourse._id] ?? 0}%</span>
                  </div>
                  <div className="courses-featured-progress-track">
                    <div className="courses-featured-progress-fill" style={{ width: `${progressMap[heroCourse._id] ?? 0}%` }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="courses-featured-btn" onClick={() => navigate(`/lecture/${heroCourse._id}`)}>
                    <FiPlay /> Continue Learning
                  </button>
                  {enrolledCourses.length > 1 && (
                    <button
                      onClick={handleShuffleHero}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "0 16px",
                        background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10,
                        cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#334155",
                      }}
                    >
                      <FiShuffle /> Shuffle
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                className="courses-featured-btn"
                disabled={cartHasCourse(heroCourse._id)}
                onClick={(e) => handleAddToCart(heroCourse, e)}
              >
                {cartHasCourse(heroCourse._id)
                  ? <><FiCheckCircle /> In Cart</>
                  : <><FiShoppingCart /> {isLoggedIn ? "Add to Cart" : "Log In to Enroll"}</>}
              </button>
            )}
          </div>
          <div className="courses-featured-right">
            <div className="courses-featured-emoji">{heroCourse.emoji}</div>
          </div>
        </div>
      )}

      {/* ── My Courses (enrolled) ── */}
      {isLoggedIn && enrolledCourses.length > 0 && (
        <>
          <h2 className="courses-count" style={{ fontWeight: 700, fontSize: 16 }}>My Courses</h2>
          <div className="courses-grid">
            {enrolledCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                enrolled
                progress={progressMap[course._id] ?? 0}
                unenrolling={unenrollingId === course._id}
                onUnenroll={handleUnenroll}
                onNavigate={() => navigate(`/activities/${course._id}`)}
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
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
          />
          {list.loading && <FiRefreshCw className="courses-search-spinner cp-spin" />}
        </div>

        <div className="courses-category-pills">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              className={`courses-pill ${(list.filters.category || "All") === cat ? "active" : ""}`}
              onClick={() => list.setFilter("category", cat === "All" ? "" : cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="courses-selects">
          <select
            className="courses-select"
            value={list.filters.level ? list.filters.level : "All Levels"}
            onChange={(e) => list.setFilter("level", e.target.value === "All Levels" ? "" : e.target.value)}
          >
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

      {(list.loading || loadingEnrolled) && (
        <p className="courses-count"><FiRefreshCw className="cp-spin" /> Loading courses…</p>
      )}

      {!list.loading && list.error && (
        <p className="courses-count"><FiAlertCircle /> {list.error}</p>
      )}

      {!list.loading && !list.error && (
        <>
          <p className="courses-count">
            {filtered.length === 0
              ? "No courses match your filters."
              : `${list.total} course${list.total !== 1 ? "s" : ""}`}
          </p>

          <div className="courses-grid">
            {filtered.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                enrolled={false}
                inCart={cartHasCourse(course._id)}
                isLoggedIn={isLoggedIn}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          <Pagination
            page={list.page}
            pages={list.pages}
            total={list.total}
            limit={list.limit}
            onPageChange={list.setPage}
          />
        </>
      )}
    </div>
  );
}

// ── Course card ─────────────────────────────────────────────
function CourseCard({ course, enrolled, progress = 0, inCart, isLoggedIn, unenrolling, onAddToCart, onUnenroll, onNavigate }) {
  const lvlStyle = LEVEL_COLOR[course.level] || LEVEL_COLOR.Beginner;
  const instructorName = typeof course.instructor === "object" ? course.instructor?.username : "Instructor";
  const lessonsCount = course.lessonsCount ?? course.lectures?.length ?? 0;
  const studentsCount = course.studentsEnrolledCount ?? course.studentsEnrolled?.length ?? 0;

  return (
    <div
      className="course-card"
      onClick={enrolled ? onNavigate : undefined}
      style={{ cursor: enrolled ? "pointer" : "default" }}
    >
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
        <p className="course-card-instructor"><FiUser /> {instructorName}</p>

        <div className="course-card-meta">
          <span><FiClock /> {course.duration}</span>
          <span><FiBookOpen /> {lessonsCount} lessons</span>
          <span>{formatPrice(course.price)}</span>
        </div>

        {enrolled && (
          <div className="course-card-progress">
            <div className="course-card-progress-label">
              <span className={`cp-tag ${progress >= 100 ? "completed" : "in-progress"}`}>
                <FiCheckCircle /> {progress >= 100 ? "Completed" : "Enrolled"}
              </span>
              <span className="cp-pct">{progress}%</span>
            </div>
            <div className="course-card-progress-track">
              <div className="course-card-progress-fill" style={{ width: `${progress}%`, background: course.color }} />
            </div>
          </div>
        )}
      </div>

      <div className="course-card-footer">
        <span className="course-card-students">{studentsCount.toLocaleString()} students</span>

        {enrolled ? (
          <button
            className="course-card-btn"
            style={{ background: "#64748b" }}
            disabled={unenrolling}
            onClick={(e) => onUnenroll(course._id, e)}
          >
            {unenrolling ? <FiRefreshCw className="cp-spin" /> : <><FiUserMinus /> Unenroll</>}
          </button>
        ) : (
          <button
            className="course-card-btn"
            style={{ background: inCart ? "#94a3b8" : course.color }}
            disabled={inCart}
            onClick={(e) => onAddToCart(course, e)}
          >
            {inCart
              ? <><FiCheckCircle /> In Cart</>
              : <>{isLoggedIn ? "Add to Cart" : "Log In"} <FiShoppingCart /></>}
          </button>
        )}
      </div>
    </div>
  );
}
