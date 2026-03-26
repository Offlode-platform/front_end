import { Search } from "lucide-react";

export function ShellSearch() {
  return (
    <div className="shell-search" role="search" aria-label="Global search">
      <Search size={15} />
      <input className="shell-search-input" placeholder="Search" readOnly />
      <span className="shell-search-shortcut">Ctrl K</span>
    </div>
  );
}
