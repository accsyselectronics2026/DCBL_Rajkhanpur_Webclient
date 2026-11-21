
import Image from "next/image";
import { getSession } from "@/lib/auth/session";
import { site } from "@/config/site";
import UserMenu from "./UserMenu";

export default async function Topbar() {
  const session = await getSession();

  return (
    <header className="relative z-10 grid h-16 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-gray-200 bg-white px-4 md:px-6">

      {/* Company Logo */}
      <div className="flex h-full items-center">
        <Image
          src="/images/logo.png"
          alt="Dalmia Bharat Limited"
          width={160}
          height={80}
          priority
          unoptimized
          className="block h-12 w-auto object-contain"
        />
      </div>

      {/* Company Title */}
      <div className="text-center leading-tight">
        <div className="text-lg font-bold text-[#8E3FD6]">
          {site.title}
        </div>

        <div className="text-sm text-gray-600">
          {site.subtitle}
        </div>
      </div>

      {/* User Menu */}
      <div className="flex items-center justify-end">
        <UserMenu
          name={session?.name ?? ""}
          email={session?.email ?? ""}
        />
      </div>

    </header>
  );
}
