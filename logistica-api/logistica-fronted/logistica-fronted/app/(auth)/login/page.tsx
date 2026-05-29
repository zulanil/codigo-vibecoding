import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (cookieStore.has("access_token")) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
