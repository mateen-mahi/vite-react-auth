import { useEffect, useMemo, useState } from "react";
import { FiUserPlus, FiUserMinus, FiSearch } from "react-icons/fi";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal";
import Spinner from "../../../components/admin-shared/Spinner";
import { showToast } from "../../../components/admin-shared/toast";

const EnrollmentModal = ({ course, onClose, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  // studentsEnrolled on the course object may be populated objects or bare IDs
  const enrolledIds = useMemo(
    () => new Set((course.studentsEnrolled || []).map((s) => s._id || s)),
    [course.studentsEnrolled]
  );

  useEffect(() => {
    (async () => {
      setLoadingUsers(true);
      try {
        const res = await api.get("/users/all-users");
        setUsers(res.data.users || res.data.data || []);
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to load users", "error");
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const enrolledUsers = useMemo(
    () => users.filter((u) => enrolledIds.has(u._id)),
    [users, enrolledIds]
  );

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (enrolledIds.has(u._id)) return false;
      if (!q) return true;
      return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
  }, [users, search, enrolledIds]);

  const enroll = async (studentId) => {
    setBusyId(studentId);
    try {
      await api.post(`/courses/${course._id}/enroll`, { studentId });
      showToast("Student enrolled", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to enroll student", "error");
    } finally {
      setBusyId(null);
    }
  };

  const unenroll = async (studentId) => {
    setBusyId(studentId);
    try {
      await api.post(`/courses/${course._id}/unenroll`, { studentId });
      showToast("Student unenrolled", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unenroll student", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal title={`Manage Enrollment — ${course.title}`} onClose={onClose} width={560}>
      {loadingUsers ? (
        <Spinner label="Loading users…" />
      ) : (
        <>
          <div className="enroll-section">
            <p className="enroll-section-title">
              Currently enrolled <span className="enroll-count">({enrolledUsers.length})</span>
            </p>
            {enrolledUsers.length === 0 ? (
              <p className="enroll-empty">No students enrolled yet.</p>
            ) : (
              <div className="enroll-list">
                {enrolledUsers.map((u) => (
                  <div className="enroll-row" key={u._id}>
                    <div className="enroll-row-info">
                      <span className="enroll-row-name">{u.username}</span>
                      <span className="enroll-row-email">{u.email}</span>
                    </div>
                    <button
                      className="btn btn-danger-outline btn-sm"
                      disabled={busyId === u._id}
                      onClick={() => unenroll(u._id)}
                    >
                      <FiUserMinus /> Unenroll
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="enroll-section">
            <p className="enroll-section-title">Enroll a new student</p>
            <div className="search-bar" style={{ maxWidth: "none", marginBottom: 10 }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or email…"
              />
            </div>
            <div className="enroll-list enroll-list-scroll">
              {filteredCandidates.length === 0 ? (
                <p className="enroll-empty">No matching users.</p>
              ) : (
                filteredCandidates.map((u) => (
                  <div className="enroll-row" key={u._id}>
                    <div className="enroll-row-info">
                      <span className="enroll-row-name">{u.username}</span>
                      <span className="enroll-row-email">{u.email}</span>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={busyId === u._id}
                      onClick={() => enroll(u._id)}
                    >
                      <FiUserPlus /> Enroll
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default EnrollmentModal;
