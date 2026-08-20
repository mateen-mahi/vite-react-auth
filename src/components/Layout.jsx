import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/Sidebar.css";
import Navbar from "./Navbar";
import Draggable from "react-draggable";
import ChatWidget from "../pages/chatWidget";
import ThemeSwitcher from "./ThemeSwitcher/ThemeSwitcher"
import DraggableFab from "./DraggableFab/DraggableFab";

export default function Layout() {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="layout">
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isMobile={isMobile}
      />

      <main
        className={`content ${
          isOpen && !isMobile ? "expanded" : "collapsed"
        }`}
      >
        <Navbar isOpen={isOpen} isMobile={isMobile} />

        <Outlet />
      </main>
<ThemeSwitcher/>

 <DraggableFab storageId="chat-fab" defaultCorner="bottom-right">
        <ChatWidget />
      </DraggableFab>
    </div>
  );
}