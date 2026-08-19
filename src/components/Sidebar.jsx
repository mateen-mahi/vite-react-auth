import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  FiMenu,
  FiX,
  FiHome,
  FiAward,
  FiSettings,
  FiFileText,
  FiLayers,
  FiLogOut,
  FiAlertCircle,
  FiBookOpen,
} from "react-icons/fi";

import "../styles/Sidebar.css";
import appConfig from "../config/appConfig";
import api from "../services/api";

export default function Sidebar({
  isOpen,
  setIsOpen,
  isMobile,
}) {
  const navigate = useNavigate();

  /*
    Get authentication information from AuthContext.

    IMPORTANT:
    This assumes your AuthContext provides:
      - user
      - refreshAuth

    If your context does not provide refreshAuth,
    remove refreshAuth from here and remove the
    await refreshAuth() line inside handleLogout().
  */
  const { user, refreshAuth } = useAuth();


  /* =========================================================
     USER INFORMATION
     ========================================================= */

  const username =
    user?.username?.charAt(0)?.toUpperCase() || "U";

  const userRole =
    user?.role?.toLowerCase()?.trim() || "";


  /* =========================================================
     ADMIN CHECK
     =========================================================

     Dashboard is visible only for:

       admin
       super-admin
       super admin
       superadmin
       super_admin
  */

  const isAdmin = [
    "admin",
    "super-admin",
    "super admin",
    "superadmin",
    "super_admin",
  ].includes(userRole);


  /* =========================================================
     SIDEBAR TOGGLE
     ========================================================= */

  const toggleSidebar = () => {
    setIsOpen((previous) => !previous);
  };


  /* =========================================================
     CLOSE SIDEBAR AFTER NAVIGATION
     =========================================================

     Desktop:
       Sidebar stays open.

     Mobile:
       Sidebar closes after selecting a page.
  */

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };


  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = async () => {
    try {
      /*
        Send logout request to backend.

        Make sure your backend route is:

          POST /users/logout

        and that it clears the authentication cookie.
      */

      await api.post(
        "/users/signout",
        {},
        {
          withCredentials: true,
        }
      );


      /*
        Refresh authentication state.

        This makes sure AuthContext knows
        that the user is no longer authenticated.
      */

      if (typeof refreshAuth === "function") {
        await refreshAuth();
      }


      /*
        Close sidebar on mobile.
      */

      if (isMobile) {
        setIsOpen(false);
      }


      /*
        Redirect user to login page.
      */

      navigate("/login", {
        replace: true,
      });

    } catch (error) {
      console.error("Logout failed:", error);


      /*
        Even if the backend request fails,
        send the user to login.

        This prevents the user from being
        stuck inside the application.
      */

      if (isMobile) {
        setIsOpen(false);
      }

      navigate("/login", {
        replace: true,
      });
    }
  };


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <>
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${
          isOpen
            ? "sidebar--expanded"
            : "sidebar--collapsed"
        }`}
      >

        {/* ===================================================
            SIDEBAR HEADER
        =================================================== */}

        <div className="sidebar-header">

          {/* =================================================
              LOGO

              Logo is visible ONLY when sidebar is open.

              When sidebar is collapsed:

                hamburger only

              When sidebar is expanded:

                logo + X button
          ================================================= */}

          {isOpen && (
            <div className="sidebar-logo">

              <div className="sidebar-logo-image">

                <img
                  src={appConfig.darkLogo}
                  alt={appConfig.appName}
                />

              </div>

            </div>
          )}


          {/* =================================================
              SIDEBAR TOGGLE

              OPEN:

                X

              CLOSED:

                Hamburger

              The button stays INSIDE the sidebar.
          ================================================= */}

          <button
            type="button"
            className={`sidebar-toggle ${
              isOpen
                ? "sidebar-toggle--close"
                : "sidebar-toggle--open"
            }`}
            onClick={toggleSidebar}
            aria-label={
              isOpen
                ? "Close sidebar"
                : "Open sidebar"
            }
            title={
              isOpen
                ? "Close sidebar"
                : "Open sidebar"
            }
          >

            {isOpen ? (
              <FiX />
            ) : (
              <FiMenu />
            )}

          </button>

        </div>


        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav className="sidebar-nav">

          {/* =================================================
              DASHBOARD

              Only visible for:

                admin
                super-admin
                super admin
                superadmin
                super_admin
          ================================================= */}

          {isAdmin && (
            <NavLink
              to="/dashboard"
              onClick={closeSidebar}
              title="Dashboard"
              className="sidebar-nav-item"
            >

              <FiHome className="sidebar-nav-icon" />

              {isOpen && (
                <span className="sidebar-nav-label">
                  Dashboard
                </span>
              )}

            </NavLink>
          )}


          {/* =================================================
              NOTES
          ================================================= */}

          <NavLink
            to="/notes"
            onClick={closeSidebar}
            title="Notes"
            className="sidebar-nav-item"
          >

            <FiFileText className="sidebar-nav-icon" />

            {isOpen && (
              <span className="sidebar-nav-label">
                Notes
              </span>
            )}

          </NavLink>


          {/* =================================================
              COURSES
          ================================================= */}

          <NavLink
            to="/courses"
            onClick={closeSidebar}
            title="Courses"
            className="sidebar-nav-item"
          >

            <FiLayers className="sidebar-nav-icon" />

            {isOpen && (
              <span className="sidebar-nav-label">
                Courses
              </span>
            )}

          </NavLink>



                    <NavLink
            to="/books"
            onClick={closeSidebar}
            title="Books"
            className="sidebar-nav-item"
          >

            <FiBookOpen className="sidebar-nav-icon" />

            {isOpen && (
              <span className="sidebar-nav-label">
                Books
              </span>
            )}

          </NavLink>



          {/* =================================================
              CERTIFICATE
          ================================================= */}

          <NavLink
            to="/certificate"
            onClick={closeSidebar}
            title="Certificate"
            className="sidebar-nav-item"
          >

            <FiAward className="sidebar-nav-icon" />

            {isOpen && (
              <span className="sidebar-nav-label">
                Certificate
              </span>
            )}

          </NavLink>


          {/* =================================================
              COMPLAINTS
          ================================================= */}

          <NavLink
            to="/complaints"
            onClick={closeSidebar}
            title="Complaints"
            className="sidebar-nav-item"
          >

            <FiAlertCircle className="sidebar-nav-icon" />

            {isOpen && (
              <span className="sidebar-nav-label">
                Complaints
              </span>
            )}

          </NavLink>


          {/* =================================================
              CHAT APP
          ================================================= */}

          <NavLink
            to="/socket-test"
            onClick={closeSidebar}
            title="Chat app"
            className="sidebar-nav-item"
          >

            <FiSettings className="sidebar-nav-icon" />

            {isOpen && (
              <span className="sidebar-nav-label">
                Chat app
              </span>
            )}

          </NavLink>

        </nav>


        {/* ===================================================
            USER FOOTER
        =================================================== */}

        <div className="sidebar-user">

          {/* =================================================
              USER AVATAR

              Always visible.
          ================================================= */}

          <div className="sidebar-user-avatar">
            {username}
          </div>


          {/* =================================================
              USER INFORMATION

              Visible only when sidebar is expanded.
          ================================================= */}

          {isOpen && (
            <div className="sidebar-user-info">

              <p className="sidebar-user-name">
                {user?.username || "User"}
              </p>

              <p className="sidebar-user-role">
                {user?.role || "Student"}
              </p>

            </div>
          )}


          {/* =================================================
              LOGOUT BUTTON

              Visible only when sidebar is expanded.
          ================================================= */}

          {isOpen && (
            <button
              type="button"
              className="sidebar-logout"
              title="Log out"
              aria-label="Log out"
              onClick={handleLogout}
            >

              <FiLogOut />

            </button>
          )}

        </div>

      </aside>


      {/* =====================================================
          MOBILE OVERLAY
      =====================================================

      Overlay appears only when:

        - sidebar is open
        - device is mobile

      Clicking outside the sidebar closes it.
      ===================================================== */}

      {isOpen && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

    </>
  );
}