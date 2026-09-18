import { redirect } from "next/navigation";

/**
 * Root route.
 *
 * Per DEVELOPMENT_PLAN.md, Dashboard is the default landing page, but its
 * real content is Phase 3's job. This route simply hands off to /dashboard,
 * which Phase 2 has as a placeholder page like every other route.
 */
export default function RootPage() {
  redirect("/dashboard");
}
