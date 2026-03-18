import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function Home() {
  // Check if user is authenticated
  const cookieStore = cookies();
  const authCookie = cookieStore.get("aisdr-auth");
  
  if (authCookie && authCookie.value === "authenticated") {
    redirect("/prospecting");
  } else {
    redirect("/login");
  }
}
