import { LoginForm } from "@/components/login-form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const username = cookieStore.get("nexus_username");

  if (username) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background with Gradient/Image */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-linear-to-tr from-purple-900/40 via-blue-900/20 to-black animate-pulse-slow" />
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black" />
         {/* Optional: Add a subtle background image here if requested */}
      </div>

      <div className="z-10 w-full max-w-md px-4">
        <LoginForm />
      </div>
    </main>
  );
}
