import "../styles/LoadingScreen.css";

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loader"></div>
      <h2>Loading...</h2>
      <p>Please wait while we prepare everything for you.</p>
    </div>
  );
};

export default LoadingScreen;