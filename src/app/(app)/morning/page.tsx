import { redirect } from "next/navigation";

export default function MorningPage() {
  redirect("/daily-love?kind=morning");
}
