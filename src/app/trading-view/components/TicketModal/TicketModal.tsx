"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader, ArrowUpRight, ArrowDownLeft, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createTicket } from "@/app/api/trading-accounts/actions";
import { TicketType, TicketStatus } from "@/app/trading-view/types/types";
import { useTradingStore } from "@/app/trading-view/store/tradingViewStore";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "transfer";
  currency?: string;
}

export function TicketModal({ isOpen, onClose, type, currency }: TicketModalProps) {
  const { selectedAccount, walletBalances, loadWalletBalances } = useTradingStore();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount?.id) {
      toast.error("No trading account selected");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!currency) {
      toast.error("No currency selected");
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketType = type === "deposit" ? TicketType.Deposit : TicketType.Withdraw;

      // Find the wallet for the selected currency
      const wallet = walletBalances.find(w => w.currency === currency);
      if (!wallet) {
        toast.error("Wallet not found for selected currency");
        return;
      }
      const result = await createTicket({
        walletId: wallet.id,
        type: ticketType,
        amount: parseFloat(amount),
      });

      if (result.success) {
        toast.success(
          `${type === "deposit" ? "Deposit" : "Transfer"} ticket created successfully!`
        );

        // Refresh wallet balances
        await loadWalletBalances();

        // Reset form and close modal
        setAmount("");
        onClose();
      } else {
        toast.error(result.error || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 mb-0">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {type === "deposit" ? (
              <ArrowDownLeft className="h-5 w-5 text-green-500" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-blue-500" />
            )}
            {type === "deposit" ? "Deposit" : "Transfer"} Funds
          </CardTitle>
          <CardDescription>
            Create a ticket for {type === "deposit" ? "depositing" : "transferring"} funds to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !amount}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  `Create ${type === "deposit" ? "Deposit" : "Transfer"} Ticket`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 