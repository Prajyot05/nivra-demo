import { redirect } from "next/navigation";

/** Clerk CLI scaffold; branded login lives at `/login`. */
export default function SignInAliasPage() {
  redirect("/login");
}
