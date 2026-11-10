import { Link, NavLink, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const tab = ({ isActive }) =>
  `flex-1 py-3 text-center text-sm border-b-2 transition-colors md:flex-none md:py-0 md:text-base md:border-0 ${
    isActive
      ? "border-black dark:border-white text-black dark:text-white font-semibold"
      : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
  }`;

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="white"
    className="size-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="black"
    className="size-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
    />
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 sm:px-6 lg:px-24 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <Link
        to="/projects"
        className="flex items-center shrink-0"
      >
        {/* Navy wordmark is unreadable on dark bg, so render it white there */}
        <img
          src="/logo.png"
          alt="Poseidon X"
          className="h-7 dark:brightness-0 dark:invert"
        />
      </Link>

      {user?.approved && (
        // Mobile: full-bleed tab strip under the logo row. md+: inline links.
        <div className="order-last basis-full grow -mx-4 sm:-mx-6 -mb-4 flex whitespace-nowrap border-t border-neutral-200 dark:border-neutral-700 md:order-0 md:basis-auto md:grow-0 md:m-0 md:gap-6 md:border-0">
          <NavLink to="/projects" className={tab}>
            Tasks
          </NavLink>
          {user.role === "admin" && (
            <NavLink to="/users" className={tab}>
              Team
            </NavLink>
          )}
          <NavLink to="/connect" className={tab}>
            Connect Claude
          </NavLink>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>

        {user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-neutral-200 dark:border-neutral-700">
            {user.profile_picture ? (
              <img src={user.profile_picture} className="w-8 h-8 rounded-full" alt="User" />
            ) : (
              <Avatar name={user.name} className="w-8 h-8 text-xs" />
            )}
            <span className="hidden sm:inline text-sm font-semibold dark:text-white">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-neutral-500 hover:text-red-500 uppercase tracking-wider transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-2 text-sm font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-all"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-3 py-2 text-sm font-bold bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800  dark:hover:bg-neutral-400 shadow-sm transition-all"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
