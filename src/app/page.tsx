import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">ADMIN DASHBOARD</h1>
      <div className="grid grid-cols-5 gap-4">
        <div className="border border-white rounded-lg">
          <Link
            href="/technical_applications"
            className="block w-full h-full text-center px-4 py-6"
          >
            Technical
          </Link>
        </div>
        <div className="border border-white  rounded-lg">
          <Link
            href="/design_applications"
            className="block w-full h-full text-center px-4 py-6"
          >
            Design
          </Link>
        </div>
        <div className="border border-white rounded-lg">
          <Link
            href="/management_applications"
            className="block w-full h-full text-center px-4 py-6"
          >
            Management
          </Link>
        </div>
        <div className="border border-white rounded-lg">
          <Link
            href="/social_media_applications"
            className="block w-full h-full text-center px-4 py-6"
          >
            Social Media
          </Link>
        </div>
        <div className="border border-white rounded-lg">
          <Link
            href="/users"
            className="block w-full h-full text-center px-4 py-6"
          >
            All Users
          </Link>
        </div>
      </div>
    </main>
  );
}
