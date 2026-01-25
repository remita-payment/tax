import DashboardLayout from "@/components/dashboard-layout";

export default function DashboardRootLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

// Optionally add dashboard-specific metadata
export const metadata = {
  title: "Dashboard",
  description: "YIRS Administration Dashboard",
};