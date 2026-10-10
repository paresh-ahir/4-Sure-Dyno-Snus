import { AdminProfileForm } from "@/components/admin/profile-form";
import { requireSession } from "@/lib/auth";
import { getSite, getUserById } from "@/lib/db";
import { publicEmails } from "@/lib/site";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const [site, user] = await Promise.all([getSite(), getUserById(session.id)]);
  if (!user) redirect("/admin/login");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Profile</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-ink">
        These contact details appear on the website footer, contact page, about
        page, and invoices.
      </p>
      <AdminProfileForm
        signInEmail={user.email}
        name={site.salesContact || ""}
        companyName={site.companyName}
        phone={site.phone}
        address={site.address}
        website={site.website}
        emails={publicEmails(site)}
      />
    </div>
  );
}
