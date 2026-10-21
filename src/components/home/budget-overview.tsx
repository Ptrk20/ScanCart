"use client";

import Link from "next/link";
import { useId } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils/money";
import type { BudgetSummary } from "@/types/models";

const percentageFormatter = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });

export function BudgetOverview({ summary, hasSession = false, showBasketLink = true }: { summary: BudgetSummary; hasSession?: boolean; showBasketLink?: boolean }) {
  const { budget } = summary;
  const headingId = useId();
  const overBudget = summary.status === "over-budget";
  const usageLabel = `${percentageFormatter.format(summary.usagePercentage)}% used`;
  const metrics: { title: string; value: string; detail: string; icon: IconName }[] = [
    { title: "Shopping budget", value: budget === null ? hasSession ? "No budget" : "--" : formatCurrency(budget), detail: budget === null ? hasSession ? "Shopping without a spending limit" : "Give your shop a spending limit" : "Your plan for this shopping trip", icon: "wallet" },
    { title: "Basket total", value: formatCurrency(summary.total), detail: `${summary.itemCount} ${summary.itemCount === 1 ? "item" : "items"} in your basket`, icon: "basket" },
    { title: overBudget ? "Over budget" : "Remaining budget", value: summary.remaining === null ? hasSession ? "No limit" : "--" : formatCurrency(overBudget ? summary.overBudgetBy : summary.remaining), detail: budget === null ? hasSession ? "No budget tracking for this session" : "Start a session to track spending" : overBudget ? "Your basket exceeds your spending limit" : summary.status === "near-budget" ? "You're nearing your budget." : "Looking good. Shop within your plan.", icon: "leaf" },
  ];
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-lg font-bold tracking-tight">Your shop at a glance</h2>
        {showBasketLink && <Link href="/basket" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-forest hover:underline">View basket <Icon name="arrow" className="size-4" /></Link>}
      </div>
      <dl className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {metrics.map(({ title, value, detail, icon }) => (
          <div key={title} className="card min-w-0 p-5">
            <dt className="flex items-center justify-between gap-3 text-sm font-medium text-muted">
              {title}<Icon name={icon} className="size-5 text-forest" />
            </dt>
            <dd className="mt-3 break-words text-3xl font-bold tracking-tight tabular-nums">{value}</dd>
            <dd className={`mt-2 text-xs leading-5 ${title === "Over budget" ? "font-semibold text-red-700" : "text-muted"}`}>{detail}</dd>
          </div>
        ))}
      </dl>
      {budget !== null && (
        <div className="card mt-3 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-semibold">{overBudget ? "Over budget" : summary.status === "near-budget" ? "Near budget" : "Within budget"}</p>
            <p className="tabular-nums text-muted">{budget === 0 ? "Zero budget set" : usageLabel}</p>
          </div>
          {budget > 0 ? (
            <div role="progressbar" aria-label="Shopping budget used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progressPercentage} aria-valuetext={`${usageLabel}. ${overBudget ? "Over budget." : summary.status === "near-budget" ? "Near budget." : "Within budget."}`} className="h-2 overflow-hidden rounded-full bg-surface">
              <div style={{ width: `${summary.progressPercentage}%` }} className={`h-full rounded-full ${overBudget ? "bg-red-700" : summary.status === "near-budget" ? "bg-amber-700" : "bg-forest"}`} />
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted">Any spending exceeds this budget. A usage percentage is not available for a zero budget.</p>
          )}
        </div>
      )}
      {budget !== null && summary.overBudgetBy > 0 && <p role="status" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">Over budget by {formatCurrency(summary.overBudgetBy)}</p>}
    </section>
  );
}
