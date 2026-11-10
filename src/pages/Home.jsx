import NavBar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-neutral-900">
      <NavBar />
      <div className="pt-32 px-24 text-center ">
        <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-black dark:text-white">
          Track all clients, projects, <br></br>teams, and tasks.
        </h1>
        <p className="mt-2 md:mt-4 lg:mt-6 text-sm md:text-lg lg:text-xl text-neutral-500 dark:text-neutral-400 font-normal">
          The streamlined workspace for engineering teams to manage
          high-performance<br></br> workflows and deliver complex systems{" "}
          <em>on time</em>.
        </p>
      </div>
      <div className="grid grid-cols-2 text-center gap-x-3 w-xl mx-auto py-12">
        <Link
          to={user && user.id ? "/projects" : "/login"}
          className="px-6 py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
        >
          Go to Projects
        </Link>
        <Link
          to={user && user.id ? "/clients" : "/login"}
          className="px-6 py-4 border-2 border-black dark:border-white text-black dark:text-white font-bold rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all cursor-pointer"
        >
          Contact Clients
        </Link>
      </div>
    </div>
  );
}
