import { redirect } from "next/navigation";

// ミドルウェアがリダイレクト済みのはずだが念のため
export default function Home() {
  redirect("/login");
}
