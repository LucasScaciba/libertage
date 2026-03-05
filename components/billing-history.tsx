"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink } from "lucide-react";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  billing_reason: string;
  period_start: number;
  period_end: number;
}

export function BillingHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/subscriptions/invoices");
      const data = await res.json();
      
      if (res.ok) {
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      paid: { label: "Pago", variant: "default" },
      open: { label: "Aberto", variant: "secondary" },
      draft: { label: "Rascunho", variant: "outline" },
      uncollectible: { label: "Não Cobrável", variant: "destructive" },
      void: { label: "Cancelado", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getBillingReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      subscription_create: "Criação de Assinatura",
      subscription_cycle: "Renovação de Assinatura",
      subscription_update: "Atualização de Assinatura",
      subscription: "Assinatura",
      manual: "Manual",
      upcoming: "Próxima",
      subscription_threshold: "Limite de Assinatura",
    };

    return reasonMap[reason] || reason;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma fatura encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Faturamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </p>
                  {getStatusBadge(invoice.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getBillingReasonLabel(invoice.billing_reason)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(invoice.created)}
                </p>
              </div>
              
              <div className="flex gap-2">
                {invoice.hosted_invoice_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(invoice.hosted_invoice_url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Fatura
                  </Button>
                )}
                {invoice.invoice_pdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(invoice.invoice_pdf!, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
