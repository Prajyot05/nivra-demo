import { redirect } from "next/navigation";

/** Clerk CLI scaffold; branded login lives at `/login`. */
export default function SignUpAliasPage() {
  redirect("/login");
}
