import { InvoiceDocument } from "@/components/orders/invoice-document";
import { requireSession } from "@/lib/auth";
import { getOrderById, getOrders, getPricing, getSite, getUserById } from "@/lib/db";
import { buildInvoice } from "@/lib/invoice";
import { publicEmails } from "@/lib/site";
import { isInvoiceAvailable } from "@/lib/orders";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || !isInvoiceAvailable(order.status)) return { title: "Invoice" };
  const orders = await getOrders(undefined, "all");
  const invoice = buildInvoice(order, null, [], orders);
  return { title: `Invoice ${invoice.number}` };
}

export default async function AdminInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();
  if (!isInvoiceAvailable(order.status)) {
    redirect(`/admin/orders/${order.id}`);
  }

  const [user, pricing, orders, site] = await Promise.all([
    getUserById(order.userId),
    getPricing(order.province),
    getOrders(undefined, "all"),
    getSite(),
  ]);

  return (
    <InvoiceDocument
      invoice={buildInvoice(order, user, pricing, orders)}
      orderId={order.id}
      canEdit
      backHref={`/admin/orders/${order.id}`}
      backLabel="Back to order"
      contact={{
        address: site.address,
        phone: site.phone,
        email: publicEmails(site)[0] || site.email,
      }}
    />
  );
}
