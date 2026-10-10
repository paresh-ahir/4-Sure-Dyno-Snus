import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getUserById,
  updateBlog,
  updateFaq,
  updateLead,
  updateOrder,
  updateProduct,
  updateUser,
  updateWholesaleInquiry,
} from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  kind: z.enum([
    "product",
    "blog",
    "faq",
    "order",
    "retailer",
    "lead",
    "wholesale",
  ]),
  id: z.string().min(1),
  restore: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const trashedAt = body.restore ? null : new Date().toISOString();
    let saved = false;

    if (body.kind === "product") saved = Boolean(await updateProduct(body.id, { trashedAt }));
    if (body.kind === "blog") saved = Boolean(await updateBlog(body.id, { trashedAt }));
    if (body.kind === "faq") saved = Boolean(await updateFaq(body.id, { trashedAt }));
    if (body.kind === "order") saved = Boolean(await updateOrder(body.id, { trashedAt }));
    if (body.kind === "lead") saved = Boolean(await updateLead(body.id, { trashedAt }));
    if (body.kind === "wholesale") {
      saved = Boolean(await updateWholesaleInquiry(body.id, { trashedAt }));
    }
    if (body.kind === "retailer") {
      const user = await getUserById(body.id);
      if (!user || user.role !== "retailer" || user.id === session.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      saved = Boolean(await updateUser(body.id, { trashedAt }));
    }

    if (!saved) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update trash" }, { status: 400 });
  }
}
