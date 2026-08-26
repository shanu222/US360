import { redirect } from "next/navigation";

export default function FoodRedirectPage() {
  redirect("/restaurants");
}
