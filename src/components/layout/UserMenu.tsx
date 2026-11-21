"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";

export default function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

 async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.assign("/login"); 
  }
}

  return (
    <div ref={ref} className="relative">
      <button
        type="button" aria-label="User menu" aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="h-10 w-10 grid place-items-center rounded-full bg-[#F3E8FF] text-[#8E3FD6] hover:bg-[#E9D5FF]">
        <User size={20} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
          <div className="border-b border-gray-200 pb-3">
            {name && <div className="text-sm font-semibold text-gray-900">{name}</div>}
            <div className="break-all text-sm text-gray-600">{email}</div>
          </div>
          <button
            type="button" role="menuitem" onClick={logout}
            className="mt-2 flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm text-gray-900 hover:bg-gray-100"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}