import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/server";
import { getResolvedPreferences } from "@/lib/preferences";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "admin" ? "/admin/publish" : "/overview");
  }

  const preferences = await getResolvedPreferences();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10">
      <LoginForm locale={preferences.locale} />
    </div>
  );
}
