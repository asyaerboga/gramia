"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
}

function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? "bg-emerald-50 text-emerald-700 font-semibold"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

interface SidebarProps {
  items: NavItemProps[];
  title?: string;
}

export default function Sidebar({ items, title = "Gramia" }: SidebarProps) {
  return (
    <nav className="w-1/5 bg-white h-screen shadow-md p-6 flex flex-col fixed left-0 top-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">{title}</h1>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}
