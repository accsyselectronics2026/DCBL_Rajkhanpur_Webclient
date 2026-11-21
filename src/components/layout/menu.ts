import {
  LayoutDashboard, Truck, Activity, Table2, Database, Settings, type LucideIcon,
} from "lucide-react";

export type MenuItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: { label: string; href: string }[];
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export const menu: MenuSection[] = [
  {
    title: "Operations",
    items: [
      // { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Bag Counter", icon: Truck, href: "/bag-counter" },
      // { label: "Current Transaction", icon: Activity, href: "/current-transaction" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { label: "Reports", icon: Table2, href: "/reports" },
    ],
  },
  // {
  //   title: "Management",
  //   items: [
  //     {
  //       label: "Master", icon: Database,
  //       children: [
  //         { label: "Add Master", href: "/master" },
  //         { label: "Product Master", href: "/master/product" },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   title: "Administration",
  //   items: [
  //     {
  //       label: "Admin Only", icon: Settings,
  //       children: [
  //         { label: "Manage User", href: "/admin/users" },
  //         { label: "User Privileges", href: "/admin/privileges" },
  //         { label: "Configuration", href: "/admin/configuration" },
  //         { label: "Device Status", href: "/admin/device-status" },
  //       ],
  //     },
  //   ],
  // },
];