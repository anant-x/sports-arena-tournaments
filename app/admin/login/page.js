import { Suspense } from "react";
import AdminLoginForm from "../../../components/client/AdminLoginForm";

export const metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLoginPage() {
  return (
    <main className="bg-[#07120d] px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<div className="rounded-lg border border-white/10 bg-white/10 p-5 font-black">Loading admin login...</div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
