import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-neutral-900">
      <Navbar />
      <main className="px-6 lg:px-24 py-8">{children}</main>
    </div>
  );
}
