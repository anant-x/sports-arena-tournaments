import AuthForm from "../../components/client/AuthForm";
import SectionHeader from "../../components/SectionHeader";

export const metadata = {
  title: "Login"
};

export default function LoginPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Account"
          title="Login"
          description="Use your saved details for faster tournament registration on this browser."
        />
        <div className="mt-8">
          <AuthForm mode="login" />
        </div>
      </div>
    </main>
  );
}
