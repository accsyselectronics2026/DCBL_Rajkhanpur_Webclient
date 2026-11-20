import {
  LayoutDashboard, Truck, Activity, Table2, Database, Settings, type LucideIcon,
} from "lucide-react";

export type MenuItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: { label: string; href: string }[];
};

export const menu: MenuItem[] = [
  // { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Bag Counter", icon: Truck, href: "/bag-counter" },
  // { label: "Current Transaction", icon: Activity, href: "/current-transaction" },
  { label: "Reports", icon: Table2, href: "/reports" },
  // {
  //   label: "Master", icon: Database,
  //   children: [
  //     { label: "Add Master", href: "/master" },
  //     { label: "Product Master", href: "/master/product" },
  //   ],
  // },
  // {
  //   label: "Admin Only", icon: Settings,
  //   children: [
  //     { label: "Manage User", href: "/admin/users" },
  //     { label: "User Privileges", href: "/admin/privileges" },
  //     { label: "Configuration", href: "/admin/configuration" },
  //     { label: "Device Status", href: "/admin/device-status" },
  //   ],
  // },
];