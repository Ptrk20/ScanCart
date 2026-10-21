import Link from "next/link";
import { Icon, type IconName } from "./icon";

export function FeaturePlaceholder({ title, description, phase, icon }: { title: string; description: string; phase: string; icon: IconName }) {
  return (
    <section className="mx-auto max-w-xl py-8 text-center sm:py-16">
      <span className="icon-tile mx-auto mb-6 size-16"><Icon name={icon} className="size-8" /></span>
      <p className="eyebrow">Coming in {phase}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-muted">{description}</p>
      <p className="mt-4 rounded-xl border border-line bg-white p-4 text-sm leading-6 text-muted">This feature is not available yet. Your active shopping session, basket, products, price records, and completed shopping trips are saved locally on this device.</p>
      <Link href="/" className="button mt-7 bg-forest text-white hover:bg-[#214c3b]">Back to Home <Icon name="arrow" className="size-4" /></Link>
    </section>
  );
}
