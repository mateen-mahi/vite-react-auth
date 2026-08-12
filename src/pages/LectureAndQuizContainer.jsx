import { useState } from "react";
import GrandQuiz from "./QuizPage";
import LecturePage from "./LectureWatching";
import "../styles/LectureAndQuizContainer.css";

export default function Container() {
  const [activeView, setActiveView] = useState("lecture");

  return (
    <div className="lqc-container">
      <nav className="lqc-nav">
        <button
          className={activeView === "lecture" ? "active" : ""}
          onClick={() => setActiveView("lecture")}
        >
          📘 Lecture
        </button>
        <button
          className={activeView === "quiz" ? "active" : ""}
          onClick={() => setActiveView("quiz")}
        >
          🧠 Quiz
        </button>
      </nav>

      <div className="lqc-content">
        {activeView === "lecture" ? <LecturePage /> : <GrandQuiz />}
      </div>
    </div>
  );
}