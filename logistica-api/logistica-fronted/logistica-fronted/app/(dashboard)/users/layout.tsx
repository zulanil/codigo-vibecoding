import { SuperuserGuard } from "@/components/auth/SuperuserGuard";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <SuperuserGuard>{children}</SuperuserGuard>;
}
