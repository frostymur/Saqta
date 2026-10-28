import React, { createContext, useContext, useState } from "react";
import { cn } from "./button";

const TabsContext = createContext({
  activeTab: "",
  setActiveTab: () => {}
});

export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [internalTab, setInternalTab] = useState(defaultValue || "");
  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = onValueChange || setInternalTab;

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-600 border border-slate-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ring-offset-white transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;

  return (
    <div className={cn("mt-3 focus-visible:outline-none", className)}>
      {children}
    </div>
  );
}
