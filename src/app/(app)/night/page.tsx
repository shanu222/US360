import { redirect } from "next/navigation";

export default function NightPage() {
  redirect("/daily-love?kind=night");
}
