import { CheckInForm } from "@/components/check-in/check-in-form";
import { Logo } from "@/components/logo";

export default function CheckInPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Logo />
        </div>
        <CheckInForm />
      </div>
    </main>
  );
}
