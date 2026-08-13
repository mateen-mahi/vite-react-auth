import { useEffect, useState } from "react";
import {
  FiAward, FiDownload, FiEye, FiX,
  FiCalendar, FiShare2, FiCheckCircle, FiLock,
  FiLoader, FiAlertCircle, FiRefreshCw, FiSearch, FiXCircle,
} from "react-icons/fi";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { withTimeout } from "../utils/withTimeout";
import "../styles/certificate.css";

const FETCH_TIMEOUT_MS = 15000;

const GRADE_COLOR = {
  "A+": { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "A": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  "B+": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};

const gradeStyle = (grade) => GRADE_COLOR[grade] || { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };

const formatDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
};

const TAB = { CERTS: "certs", VERIFY: "verify" };

export default function Certificate() {
  const { onEvent } = useAuth();

  const [tab, setTab] = useState(TAB.CERTS);

  const [courses, setCourses] = useState([]);
  const [eligibilityThreshold, setEligibilityThreshold] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  const [generatingId, setGeneratingId] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  const [viewing, setViewing] = useState(null); // certificate + course being previewed

  const [verifyInput, setVerifyInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // { valid, data } | { valid: false }
  const [verifyError, setVerifyError] = useState(null);

  // ── Fetch this student's courses + certificate status ────
  useEffect(() => {
    let cancelled = false;

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await withTimeout(api.get("/certificates/my-courses"), FETCH_TIMEOUT_MS, "Loading certificates");
        if (cancelled) return;
        setCourses(res.data?.courses || []);
        if (res.data?.eligibilityThreshold != null) setEligibilityThreshold(res.data.eligibilityThreshold);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load your certificates.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  // ── Real-time: a certificate can be auto-issued by the backend the
  // moment a lecture/quiz crosses the eligibility threshold — pick that
  // up live instead of requiring a refresh.
  useEffect(() => {
    if (!onEvent) return;

    const off = onEvent("certificate:issued", (data) => {
      setCourses((prev) =>
        prev.map((c) =>
          String(c.courseId) === String(data.courseId)
            ? {
                ...c,
                certificate: {
                  id: data.certificateId,
                  certificateNumber: data.certificateNumber,
                  url: data.documentUrl,
                  grade: null,
                  status: "active",
                  issuedAt: new Date().toISOString(),
                },
              }
            : c
        )
      );
    });

    return () => off();
  }, [onEvent]);

  const handleRetry = () => setRetryTick((t) => t + 1);

  // ── Self-serve generate ───────────────────────────────────
  const handleGenerate = async (courseId) => {
    setGeneratingId(courseId);
    setGenerateError(null);
    try {
      const res = await api.post(`/certificates/generate/${courseId}`);
      const cert = res.data?.certificate;
      if (cert) {
        setCourses((prev) =>
          prev.map((c) =>
            String(c.courseId) === String(courseId)
              ? {
                  ...c,
                  certificate: {
                    id: cert._id,
                    certificateNumber: cert.certificateNumber,
                    url: cert.document?.url,
                    grade: cert.grade,
                    status: cert.status,
                    issuedAt: cert.issuedAt,
                  },
                }
              : c
          )
        );
      }
    } catch (err) {
      setGenerateError(err.response?.data?.message || err.message || "Couldn't generate certificate. Try again.");
    } finally {
      setGeneratingId(null);
    }
  };

  // ── Public verification ───────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    const number = verifyInput.trim();
    if (!number) return;

    setVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const res = await api.get(`/certificates/verify/${encodeURIComponent(number)}`);
      setVerifyResult({ valid: true, data: res.data?.data });
    } catch (err) {
      if (err.response?.status === 404) {
        setVerifyResult({ valid: false });
      } else {
        setVerifyError(err.message || "Verification failed. Try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const earned = courses.filter((c) => c.certificate);
  const eligibleNotGenerated = courses.filter((c) => c.eligible && !c.certificate);
  const inProgress = courses.filter((c) => !c.eligible);

  // ════════════════════════════════════════════════════════
  // LOADING / ERROR
  // ════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="cert-page">
        <div className="cert-state">
          <FiLoader className="cert-spin" />
          <p>Loading your certificates…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cert-page">
        <div className="cert-state cert-state-error">
          <FiAlertCircle />
          <p>{error}</p>
          <button className="cert-retry-btn" onClick={handleRetry}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cert-page">

      {/* ── Header ── */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Certificates</h1>
          <p className="cert-subtitle">
            You've earned <strong>{earned.length}</strong> certificate{earned.length !== 1 ? "s" : ""}
            {eligibleNotGenerated.length > 0 && (
              <> — <strong>{eligibleNotGenerated.length}</strong> more ready to generate.</>
            )}
          </p>
        </div>
        <div className="cert-header-badge">
          <FiAward />
          <span>{earned.length} Earned</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cert-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === TAB.CERTS}
          className={`cert-tab-btn ${tab === TAB.CERTS ? "active" : ""}`}
          onClick={() => setTab(TAB.CERTS)}
        >
          <FiAward /> My Certificates
        </button>
        <button
          role="tab"
          aria-selected={tab === TAB.VERIFY}
          className={`cert-tab-btn ${tab === TAB.VERIFY ? "active" : ""}`}
          onClick={() => setTab(TAB.VERIFY)}
        >
          <FiSearch /> Verify a Certificate
        </button>
      </div>

      {tab === TAB.CERTS ? (
        <>
          {/* ── Stats Row ── */}
          <div className="cert-stats">
            {[
              { label: "Earned", value: earned.length, color: "#2563eb" },
              { label: "Ready to Generate", value: eligibleNotGenerated.length, color: "#16a34a" },
              { label: "In Progress", value: inProgress.length, color: "#d97706" },
            ].map((s) => (
              <div key={s.label} className="cert-stat" style={{ "--sc": s.color }}>
                <span className="cert-stat-value">{s.value}</span>
                <span className="cert-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="cert-state">
              <p>You haven't started any courses yet.</p>
            </div>
          )}

          {/* ── Earned Certificates ── */}
          {earned.length > 0 && (
            <section className="cert-section">
              <h2 className="cert-section-title">
                <FiCheckCircle className="cert-section-icon earned" /> Earned
              </h2>
              <div className="cert-grid">
                {earned.map((c) => {
                  const gc = gradeStyle(c.certificate.grade);
                  return (
                    <div key={c.courseId} className="cert-card" style={{ "--cc": gc.color }}>
                      <div
                        className="cert-card-banner"
                        style={{
                          background: `linear-gradient(135deg, ${gc.color}22, ${gc.color}40)`,
                          borderBottom: `3px solid ${gc.color}`,
                        }}
                      >
                        <span className="cert-card-emoji">🏆</span>
                        {c.certificate.grade && (
                          <span
                            className="cert-card-grade"
                            style={{ background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}
                          >
                            {c.certificate.grade}
                          </span>
                        )}
                      </div>

                      <div className="cert-card-body">
                        <p className="cert-card-course">{c.title}</p>

                        <div className="cert-card-meta">
                          <span><FiCalendar /> {formatDate(c.certificate.issuedAt)}</span>
                        </div>

                        <div className="cert-score-row">
                          <span className="cert-score-label">Progress</span>
                          <div className="cert-score-track">
                            <div
                              className="cert-score-fill"
                              style={{ width: `${c.overallProgress}%`, background: gc.color }}
                            />
                          </div>
                          <span className="cert-score-val" style={{ color: gc.color }}>{c.overallProgress}%</span>
                        </div>

                        <p className="cert-id">ID: {c.certificate.certificateNumber}</p>
                      </div>

                      <div className="cert-card-footer">
                        <button className="cert-btn-view" onClick={() => setViewing(c)}>
                          <FiEye /> View
                        </button>
                        <a
                          className="cert-btn-download"
                          style={{ background: gc.color }}
                          href={c.certificate.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FiDownload /> Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Ready to Generate ── */}
          {eligibleNotGenerated.length > 0 && (
            <section className="cert-section">
              <h2 className="cert-section-title">
                <FiAward className="cert-section-icon earned" /> Ready to Generate
              </h2>
              {generateError && <div className="cert-generate-error">{generateError}</div>}
              <div className="cert-locked-grid">
                {eligibleNotGenerated.map((c) => (
                  <div key={c.courseId} className="cert-locked-card">
                    <div className="cert-locked-emoji" style={{ background: "#16a34a18" }}>🎓</div>
                    <div className="cert-locked-info">
                      <p className="cert-locked-name">{c.title}</p>
                      <div className="cert-locked-bar-row">
                        <div className="cert-locked-track">
                          <div className="cert-locked-fill" style={{ width: `${c.overallProgress}%`, background: "#16a34a" }} />
                        </div>
                        <span className="cert-locked-pct" style={{ color: "#16a34a" }}>{c.overallProgress}%</span>
                      </div>
                      <p className="cert-locked-hint">You've hit {eligibilityThreshold}%+ — your certificate is ready.</p>
                    </div>
                    <button
                      className="cert-btn-generate"
                      disabled={generatingId === c.courseId}
                      onClick={() => handleGenerate(c.courseId)}
                    >
                      {generatingId === c.courseId ? (
                        <>
                          <FiLoader className="cert-spin" /> Generating…
                        </>
                      ) : (
                        <>
                          <FiAward /> Generate
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── In Progress / Locked ── */}
          {inProgress.length > 0 && (
            <section className="cert-section">
              <h2 className="cert-section-title">
                <FiLock className="cert-section-icon locked" /> In Progress
              </h2>
              <div className="cert-locked-grid">
                {inProgress.map((c) => (
                  <div key={c.courseId} className="cert-locked-card">
                    <div className="cert-locked-emoji" style={{ background: "#d9770618" }}>📘</div>
                    <div className="cert-locked-info">
                      <p className="cert-locked-name">{c.title}</p>
                      <div className="cert-locked-bar-row">
                        <div className="cert-locked-track">
                          <div className="cert-locked-fill" style={{ width: `${c.overallProgress}%`, background: "#d97706" }} />
                        </div>
                        <span className="cert-locked-pct" style={{ color: "#d97706" }}>{c.overallProgress}%</span>
                      </div>
                      <p className="cert-locked-hint">Reach {eligibilityThreshold}% to unlock your certificate.</p>
                    </div>
                    <FiLock className="cert-locked-icon" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        // ── VERIFY TAB ──
        <section className="cert-section cert-verify-section">
          <h2 className="cert-section-title"><FiSearch /> Verify a Certificate</h2>
          <p className="cert-verify-hint">Anyone can check whether a certificate ID is genuine — no account needed.</p>

          <form className="cert-verify-form" onSubmit={handleVerify}>
            <input
              type="text"
              className="cert-verify-input"
              placeholder="e.g. CERT-1699999999999-AB12CD34"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
            />
            <button type="submit" className="cert-verify-btn" disabled={verifying || !verifyInput.trim()}>
              {verifying ? <FiLoader className="cert-spin" /> : <FiSearch />} Verify
            </button>
          </form>

          {verifyError && <div className="cert-generate-error">{verifyError}</div>}

          {verifyResult && verifyResult.valid && (
            <div className="cert-verify-result valid">
              <FiCheckCircle className="cert-verify-icon" />
              <div>
                <p className="cert-verify-title">Valid Certificate</p>
                <p className="cert-verify-line"><strong>{verifyResult.data?.student?.username}</strong> completed <strong>{verifyResult.data?.course?.title}</strong></p>
                {verifyResult.data?.instructor?.username && (
                  <p className="cert-verify-line">Instructed by {verifyResult.data.instructor.username}</p>
                )}
                {verifyResult.data?.grade && <p className="cert-verify-line">Grade: {verifyResult.data.grade}</p>}
                <p className="cert-verify-line">Issued: {formatDate(verifyResult.data?.issuedAt)}</p>
                <p className="cert-verify-line cert-id">ID: {verifyResult.data?.certificateNumber}</p>
              </div>
            </div>
          )}

          {verifyResult && !verifyResult.valid && (
            <div className="cert-verify-result invalid">
              <FiXCircle className="cert-verify-icon" />
              <div>
                <p className="cert-verify-title">Not Found</p>
                <p className="cert-verify-line">No active certificate matches that ID. Check for typos and try again.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══ CERTIFICATE PREVIEW MODAL ══ */}
      {viewing && (
        <div className="cert-modal-overlay" onClick={() => setViewing(null)}>
          <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cert-modal-toolbar">
              <span className="cert-modal-toolbar-title">{viewing.title}</span>
              <div className="cert-modal-toolbar-actions">
                <a
                  className="cert-toolbar-btn"
                  href={viewing.certificate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download"
                >
                  <FiDownload /> Download
                </a>
                <button
                  className="cert-toolbar-btn share"
                  title="Copy verification link"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `${window.location.origin}/verify/${viewing.certificate.certificateNumber}`
                    );
                  }}
                >
                  <FiShare2 /> Share
                </button>
                <button className="cert-toolbar-close" onClick={() => setViewing(null)}>
                  <FiX />
                </button>
              </div>
            </div>

            <div className="cert-modal-scroll">
              {viewing.certificate.url ? (
                <iframe
                  src={viewing.certificate.url}
                  title={`Certificate — ${viewing.title}`}
                  className="cert-pdf-frame"
                />
              ) : (
                <div className="cert-state">
                  <p>Certificate file isn't available right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
