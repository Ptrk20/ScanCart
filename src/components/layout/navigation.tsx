"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/scan", label: "Scan", icon: "scan" },
  { href: "/basket", label: "Basket", icon: "basket" },
  { href: "/history", label: "History", icon: "history" },
];

export function Navigation() {
  const pathname = usePathname();
  return <NavigationLinks pathname={pathname} />;
}

export function NavigationFallback() {
  return <NavigationLinks />;
}

function NavigationLinks({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Main navigation" className="bottom-navigation fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur-lg md:static md:border-0 md:bg-transparent md:p-0">
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-3 py-2 md:flex md:max-w-none md:gap-2 md:p-0">
        {links.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(`${href}/`) === true;
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 text-[11px] font-semibold transition-colors md:min-h-11 md:flex-row md:gap-2 md:text-sm ${active ? "bg-sage text-forest" : "text-muted hover:bg-surface hover:text-forest"}`}>
                <Icon name={icon} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
