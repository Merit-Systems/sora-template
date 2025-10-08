"use client";

import { ConnectionSelector } from "./connection-selector";

export function AppHeader() {
  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full mb-4 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm gap-3 sm:gap-0">
      <div className="flex items-center space-x-3">
        <h1 className="text-2xl sm:text-3xl font-mono bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Sora 2 Explorer
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <ConnectionSelector />
      </div>
    </header>
  );
}
