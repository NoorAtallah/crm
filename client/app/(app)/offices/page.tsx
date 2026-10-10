import { redirect } from "next/navigation";

/** Offices has no page yet — staff moved to its own route. */
export default function OfficesPage() {
  redirect("/staff");
}
