
import { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import SidebarProvider from "@/components/layout/SidebarProvider";
import Topbar from "@/components/layout/Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-[#F2EDF3]">

        {/* Sidebar - Full Height */}
        <Sidebar />

        {/* Main Application Area */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Top Header */}
          <Suspense
            fallback={
              <div className="h-16 shrink-0 border-b border-gray-200 bg-white" />
            }
          >
            <Topbar />
          </Suspense>

          {/* Page Content */}
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
            {children}
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}
