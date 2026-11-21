
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { menu } from "./menu";
import { useSidebar } from "./SidebarProvider";

const row = "flex items-center gap-3 h-11 px-3 rounded-md border-l-4 text-sm";

const rowCls = (active: boolean) =>
  `${row} ${
    active
      ? "border-[#8E3FD6] bg-[#F3E8FF] text-[#8E3FD6] font-semibold"
      : "border-transparent text-gray-700 hover:bg-gray-100"
  }`;

function NavList({
  compact,
  onNavigate,
}: {
  compact: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const [open, setOpen] = useState<string | null>(
    () =>
      menu
        .flatMap((s) => s.items)
        .find((m) =>
          m.children?.some((c) => pathname.startsWith(c.href))
        )?.label ?? null
  );

  return (
    <nav className="flex flex-col gap-4">
      {menu.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">

          {compact ? (
            <hr className="mx-2 border-gray-200" />
          ) : (
            <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              {section.title}
            </div>
          )}

          {section.items.map((item) => {
            const Icon = item.icon;

            if (!item.children) {
              const active = pathname.startsWith(item.href!);

              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={onNavigate}
                  title={compact ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={rowCls(active)}
                >
                  <Icon size={18} className="shrink-0" />
                  {!compact && item.label}
                </Link>
              );
            }

            const isOpen = open === item.label && !compact;
            const childActive = item.children.some((c) =>
              pathname.startsWith(c.href)
            );

            return (
              <div key={item.label}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={item.label}
                  title={compact ? item.label : undefined}
                  onClick={() =>
                    setOpen(isOpen ? null : item.label)
                  }
                  className={`${rowCls(childActive && !isOpen)} w-full ${
                    compact ? "" : "justify-between"
                  }`}>

                  <span className="flex items-center gap-3">
                    <Icon size={18} className="shrink-0" />
                    {!compact && item.label}
                  </span>
                  
                  {!compact && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {isOpen && (
                  <div className="ml-7 mt-1 flex flex-col gap-1 border-l border-gray-200 pl-2">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={onNavigate}
                        className={rowCls(pathname === c.href)}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const {
    collapsed,
    toggleCollapsed,
    mobileOpen,
    setMobileOpen,
  } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => {
          if (collapsed) toggleCollapsed();
        }}
        onMouseLeave={() => {
          if (!collapsed) toggleCollapsed();
        }}
        className={`hidden md:flex shrink-0 flex-col bg-white border-r border-gray-200 p-3 overflow-y-auto transition-[width] duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-60"
        }`}>
        <NavList compact={collapsed} />
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <aside className="relative h-full w-64 overflow-y-auto bg-white p-3 shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-md text-gray-700 hover:bg-gray-100"
            >
              <X size={18} />
            </button>

            <div className="pt-12">
              <NavList
                compact={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
