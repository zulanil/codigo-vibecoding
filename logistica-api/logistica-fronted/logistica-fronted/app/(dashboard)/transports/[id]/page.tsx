import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TransportEdit } from "@/components/transports/TransportEdit";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TransportDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/transports"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Editar Transporte</h1>
      </div>
      <TransportEdit id={Number(id)} />
    </div>
  );
}
