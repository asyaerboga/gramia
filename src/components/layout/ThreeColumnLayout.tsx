import { ReactNode } from "react";

interface ThreeColumnLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  right?: ReactNode;
}

export default function ThreeColumnLayout({
  sidebar,
  main,
  right,
}: ThreeColumnLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar spacer */}
      <div className="w-1/5 flex-shrink-0" />
      {/* Sidebar is fixed, rendered separately */}
      {sidebar}
      {/* Main content */}
      <main className="w-3/5 bg-green-50 min-h-screen p-6">{main}</main>
      {/* Right panel */}
      <aside className="w-1/5 bg-white min-h-screen p-6 shadow-sm">
        {right}
      </aside>
    </div>
  );
}
