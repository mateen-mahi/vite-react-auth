import { useEffect, useState } from "react";
import api from "../../../services/api";
import Modal from "../../../components/admin-shared/Modal";
import Spinner from "../../../components/admin-shared/Spinner";
import { showToast } from "../../../components/admin-shared/toast.js";

const UserDetailsModal = ({ user, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/users/single-user/${user._id}`);
        if (mounted) setDetails(res.data.data || res.data.user || res.data);
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to load user", "error");
        onClose();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);

  return (
    <Modal title="User Details" onClose={onClose} width={460}>
      {loading ? (
        <Spinner label="Loading user…" />
      ) : (
        <div className="detail-list">
          <DetailRow label="Username" value={details.username} />
          <DetailRow label="Email" value={details.email} />
          <DetailRow label="Role" value={details.role} />
          <DetailRow label="Gender" value={details.gender} />
          <DetailRow
            label="Verified"
            value={details.isVerified ? "Yes" : "No"}
          />
          {details.createdAt && (
            <DetailRow
              label="Joined"
              value={new Date(details.createdAt).toLocaleDateString()}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value ?? "—"}</span>
  </div>
);

export default UserDetailsModal;
