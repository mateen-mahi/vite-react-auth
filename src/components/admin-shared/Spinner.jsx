import "./css/index.css";

const Spinner = ({ label = "Loading…", size = 28 }) => {
  return (
    <div className="spinner-wrap">
      <div className="cp-spin spinner-ring" style={{ width: size, height: size }} />
      {label && <p className="spinner-label">{label}</p>}
    </div>
  );
};

export default Spinner;
