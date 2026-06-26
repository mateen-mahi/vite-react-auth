import { useEffect, useState } from "react";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Toggle Button */}

      <button
        className={`menu-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}

      <aside className={`sidebar ${isOpen ? "show" : ""}`}>
        <div className="logo">
          <h2>Academy</h2>
        </div>

        <nav>
          <a href="#">Dashboard</a>
          <a href="#">Lectures</a>
          <a href="#">Grand Quiz</a>
          <a href="#">Profile</a>
          <a href="#">Settings</a>
        </nav>
      </aside>

      {/* Overlay */}

      {isOpen && (
        <div
          className="overlay"
          onClick={() => window.innerWidth <= 768 && setIsOpen(false)}
        />
      )}
    </>
  );
}