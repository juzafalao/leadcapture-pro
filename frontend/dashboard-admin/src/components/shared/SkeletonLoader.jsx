import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 animate-pulse">
      <div className="w-8 h-8 bg-white/5 rounded-xl mb-3" />
      <div className="w-12 h-7 bg-white/5 rounded-lg mb-2" />
      <div className="w-16 h-3 bg-white/5 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-white/5 animate-pulse">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5" />
          <div>
            <div className="w-28 h-4 bg-white/5 rounded mb-1" />
            <div className="w-20 h-3 bg-white/5 rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <div className="w-36 h-4 bg-white/5 rounded mb-1" />
        <div className="w-24 h-3 bg-white/5 rounded" />
      </td>
      <td className="px-4 py-4 hidden xl:table-cell">
        <div className="w-24 h-4 bg-white/5 rounded mb-1" />
        <div className="w-16 h-3 bg-white/5 rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="w-20 h-6 bg-white/5 rounded-full" />
      </td>
      <td className="px-4 py-4 hidden lg:table-cell">
        <div className="w-20 h-4 bg-white/5 rounded" />
      </td>
      <td className="px-4 py-4 text-right">
        <div className="w-24 h-8 bg-white/5 rounded-xl ml-auto" />
      </td>
    </tr>
  );
}
