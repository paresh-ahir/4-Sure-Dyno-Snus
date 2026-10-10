import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateSite, updateUser } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().max(120),
  companyName: z.string().trim().min(2, "Enter the company name.").max(120),
  phone: z.string().trim().min(7, "Enter a phone number.").max(40),
  address: z.string().trim().min(4, "Enter the address.").max(240),
  website: z.string().trim().min(3, "Enter the website.").max(120),
  emails: z
    .array(z.string().trim().email("Enter a valid email address.").max(160))
    .min(1, "Add at least one email.")
    .max(4),
});

export async function PATCH(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = profileSchema.parse(await req.json());
    const emails = [...new Set(body.emails.map((email) => email.trim()))];
    await updateSite({
      companyName: body.companyName,
      salesContact: body.name,
      phone: body.phone,
      address: body.address,
      website: body.website,
      email: emails[0],
      emails,
    });
    await updateUser(session.id, {
      ...(body.name ? { name: body.name } : {}),
      company: body.companyName,
      phone: body.phone,
      address: body.address,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Check the contact details." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Could not save the profile." }, { status: 400 });
  }
}
