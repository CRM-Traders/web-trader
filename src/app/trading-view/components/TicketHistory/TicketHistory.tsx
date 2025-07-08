"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";
import { TicketType, TicketStatus } from "@/app/trading-view/types/types";
import { Ticket, ArrowDownLeft, ArrowUpRight, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TicketHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TicketHistory({ isOpen, onClose }: TicketHistoryProps) {
  const { selectedAccount, tickets, loadTickets } = useTradingStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedAccount?.id) {
      loadTickets();
    }
  }, [isOpen, selectedAccount?.id, loadTickets]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadTickets();
    setIsLoading(false);
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case TicketStatus.Pending:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case TicketStatus.Processing:
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case TicketStatus.Completed:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case TicketStatus.Cancelled:
      case TicketStatus.Failed:
      case TicketStatus.Rejected:
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case TicketStatus.Pending:
        return "bg-yellow-500";
      case TicketStatus.Processing:
        return "bg-blue-500";
      case TicketStatus.Completed:
        return "bg-green-500";
      case TicketStatus.Cancelled:
        return "bg-gray-500";
      case TicketStatus.Failed:
        return "bg-red-500";
      case TicketStatus.Rejected:
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case TicketStatus.Pending:
        return "Pending";
      case TicketStatus.Processing:
        return "Processing";
      case TicketStatus.Completed:
        return "Completed";
      case TicketStatus.Cancelled:
        return "Cancelled";
      case TicketStatus.Failed:
        return "Failed";
      case TicketStatus.Rejected:
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const getTypeIcon = (type: number) => {
    return type === TicketType.Deposit ? (
      <ArrowDownLeft className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-blue-500" />
    );
  };

  const getTypeText = (type: number) => {
    return type === TicketType.Deposit ? "Deposit" : "Transfer";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ticket History
              </CardTitle>
              <CardDescription>
                View and manage your deposit and transfer tickets
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 px-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 px-3"
              >
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No tickets found</p>
              <p className="text-sm">Create a deposit or transfer ticket to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(ticket.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getTypeText(ticket.type)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {ticket.currency}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.amount.toLocaleString(undefined, {
                            minimumFractionDigits: ticket.currency === "USDT" ? 2 : 8,
                            maximumFractionDigits: ticket.currency === "USDT" ? 2 : 8,
                          })} {ticket.currency}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <Badge 
                        className={getStatusColor(ticket.status)}
                        variant="secondary"
                      >
                        {getStatusText(ticket.status)}
                      </Badge>
                    </div>
                  </div>

                  {ticket.description && (
                    <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      {ticket.description}
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
                    {ticket.updatedAt && (
                      <span>Updated: {new Date(ticket.updatedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 