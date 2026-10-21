import type { Metadata } from "next";
import { BasketDashboard } from "@/components/basket/basket-dashboard";

export const metadata: Metadata = { title: "Basket" };

export default function BasketPage() {
  return <BasketDashboard />;
}
