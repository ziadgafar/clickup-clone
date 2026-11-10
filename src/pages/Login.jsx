import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
  };

  useEffect(() => {
    if (user) navigate("/projects");
  }, [user, navigate]);

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-neutral-900">
      <Navbar />
      <div className="flex items-center justify-center mt-20 px-24">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-sm w-full max-w-md">
          <h2 className="text-3xl font-black text-black dark:text-white">
            Welcome back!
          </h2>
          <p className=" text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl font-normal mb-6">
            Let's get you back on track.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
            <button
              type="submit"
              className="py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all"
            >
              Login
            </button>
          </form>
          {error && (
            <p className="text-red-500 text-sm m-4 text-center">{error}</p>
          )}
          <p className="text-sm text-neutral-500 mt-4 text-center">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-black dark:text-white hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
