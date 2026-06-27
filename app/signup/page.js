import AuthForm from "../../components/client/AuthForm";
import SectionHeader from "../../components/SectionHeader";

export const metadata = {
  title: "Sign Up"
};

export default function SignupPage() {
  return (
    <main className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Account"
          title="Create your player profile"
          description="Save contact details once and reuse them while registering for cricket, badminton, tennis, and other tournaments."
        />
        <div className="mt-8">
          <AuthForm mode="signup" />
        </div>
      </div>
    </main>
  );
}
