import type { Metadata } from "next";
import { NewRequestForm } from "@/components/reporter/NewRequestForm";
import { getCatalog } from "@/lib/requests/queries";

export const metadata: Metadata = { title: "แจ้งซ่อม" };

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ category?: string; room?: string }> }) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams]);
  const prefill = params.category || params.room ? { categoryId: Number(params.category) || undefined, roomId: Number(params.room) || undefined } : undefined;
  return <NewRequestForm catalog={catalog} prefill={prefill} />;
}
