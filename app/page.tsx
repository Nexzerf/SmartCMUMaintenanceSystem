import { redirect } from "next/navigation";

// Middleware routes signed-in users to their role home; this is the fallback.
export default function Root() {
  redirect("/login");
}
