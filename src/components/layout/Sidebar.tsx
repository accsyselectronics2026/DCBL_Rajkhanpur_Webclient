"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { menu } from "./menu";

const base = "flex items-center gap-3 h-11 px-3 rounded-md text-sm";
const cls = (active: boolean) =>
  `${base} ${active ? "bg-[#F3E8FF] text-[#8E3FD6] font-semibold" : "text-gray-700 hover:bg-gray-100"}`;

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(
    () => menu.find((m) => m.children?.some((c) => pathname.startsWith(c.href)))?.label ?? null
  );

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col gap-1 bg-white border-r border-gray-200 p-3">
      <div className="px-3 py-4 text-lg font-bold text-[#8E3FD6]">MRP Validation</div>
      <nav className="flex flex-col gap-1">
        {menu.map((item) => {
          const Icon = item.icon;
          if (!item.children) {
            return (
              <Link key={item.label} href={item.href!} className={cls(pathname.startsWith(item.href!))}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          }
          const isOpen = open === item.label;
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.label)}
                className={`${cls(false)} w-full justify-between`}
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-3"><Icon size={18} /> {item.label}</span>
                <ChevronDown size={16} className={isOpen ? "rotate-180" : ""} />
              </button>
              {isOpen && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {item.children.map((c) => (
                    <Link key={c.href} href={c.href} className={cls(pathname === c.href)}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}