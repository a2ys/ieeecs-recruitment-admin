import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-center md:text-4xl">
        ADMIN DASHBOARD
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="border border-white/30 rounded-lg transition-all hover:bg-white/10 hover:-translate-y-1">
          <Link
            href="/technical_applications"
            className="block w-full h-full text-center px-4 py-6 font-medium"
          >
            Technical
          </Link>
        </div>
        <div className="border border-white/30 rounded-lg transition-all hover:bg-white/10 hover:-translate-y-1">
          <Link
            href="/design_applications"
            className="block w-full h-full text-center px-4 py-6 font-medium"
          >
            Design
          </Link>
        </div>
        <div className="border border-white/30 rounded-lg transition-all hover:bg-white/10 hover:-translate-y-1">
          <Link
            href="/management_applications"
            className="block w-full h-full text-center px-4 py-6 font-medium"
          >
            Management
          </Link>
        </div>
        <div className="border border-white/30 rounded-lg transition-all hover:bg-white/10 hover:-translate-y-1">
          <Link
            href="/social_media_applications"
            className="block w-full h-full text-center px-4 py-6 font-medium"
          >
            Social Media
          </Link>
        </div>
        <div className="border border-white/30 rounded-lg transition-all hover:bg-white/10 hover:-translate-y-1">
          <Link
            href="/users"
            className="block w-full h-full text-center px-4 py-6 font-medium"
          >
            All Users
          </Link>
        </div>
      </div>
    </main>
  );
}
