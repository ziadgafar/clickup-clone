import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) setError(error.message);
    else if (!data.session) setInfo("Check your email to confirm your account.");
  };

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-neutral-900">
      <Navbar />
      <div className="flex items-center justify-center mt-20 px-24">
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-sm w-full max-w-md">
          <h2 className="text-3xl font-black text-black dark:text-white">
            Welcome to PSD Task Manager!
          </h2>
          <p className=" text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl font-normal mb-6">
            Let's sign you up and get started.
          </p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {info && <p className="text-green-600 text-sm mb-4">{info}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              required
            >
              <option value="">Select a role</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>
            <button
              type="submit"
              className="py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all"
            >
              Sign Up
            </button>
          </form>
          <p className="text-sm text-neutral-500 mt-4 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-black dark:text-white hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
