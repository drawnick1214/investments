import { supabase } from "./client";
import type { CashFlow, CashFlowFormData } from "../types";

// Get all cash flows
export async function getAllCashFlows(): Promise<CashFlow[]> {
  const { data, error } = await supabase
    .from("cash_flows")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(`Get cash flows: ${error.message}`);
  return data || [];
}

// Get cash flows in date range
export async function getCashFlowsInRange(
  startDate: string,
  endDate: string
): Promise<CashFlow[]> {
  const { data, error } = await supabase
    .from("cash_flows")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (error) throw new Error(`Get cash flows in range: ${error.message}`);
  return data || [];
}

// Get cash flows by type
export async function getCashFlowsByType(
  type: "deposit" | "withdrawal" | "transfer"
): Promise<CashFlow[]> {
  const { data, error } = await supabase
    .from("cash_flows")
    .select("*")
    .eq("type", type)
    .order("date", { ascending: false });

  if (error) throw new Error(`Get cash flows by type: ${error.message}`);
  return data || [];
}

// Create a cash flow
export async function createCashFlow(
  flowData: CashFlowFormData
): Promise<CashFlow> {
  const { data, error } = await supabase
    .from("cash_flows")
    .insert({
      date: flowData.date,
      type: flowData.type,
      amount: flowData.amount,
      currency: flowData.currency,
      account: flowData.account || null,
      from_account: flowData.from_account || null,
      to_account: flowData.to_account || null,
      notes: flowData.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Create cash flow: ${error.message}`);
  return data as CashFlow;
}

// Update a cash flow
export async function updateCashFlow(
  id: string,
  updates: Partial<CashFlowFormData>
): Promise<CashFlow> {
  const { data, error } = await supabase
    .from("cash_flows")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Update cash flow: ${error.message}`);
  return data as CashFlow;
}

// Delete a cash flow
export async function deleteCashFlow(id: string): Promise<void> {
  const { error } = await supabase.from("cash_flows").delete().eq("id", id);

  if (error) throw new Error(`Delete cash flow: ${error.message}`);
}

// Calculate net cash flows (deposits - withdrawals)
export async function getNetCashFlows(
  startDate?: string,
  endDate?: string
): Promise<{ deposits: number; withdrawals: number; net: number }> {
  let query = supabase.from("cash_flows").select("type, amount, currency");

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data, error } = await query;

  if (error) throw new Error(`Get net cash flows: ${error.message}`);

  let deposits = 0;
  let withdrawals = 0;

  for (const flow of data || []) {
    // For now, assume all flows are in USD
    // TODO: Convert to USD using TRM if currency is COP
    const amount = flow.amount;

    if (flow.type === "deposit") {
      deposits += amount;
    } else if (flow.type === "withdrawal") {
      withdrawals += amount;
    }
  }

  return {
    deposits,
    withdrawals,
    net: deposits - withdrawals,
  };
}
