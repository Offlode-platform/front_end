"use client";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container active">
      <Header />
      <div className="app-main">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
