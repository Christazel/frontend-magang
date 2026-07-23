import React from "react";
import { Button } from "./Button";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  itemName?: string;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  rowsPerPage,
  onPageChange,
  itemName = "data",
}: PaginationProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const to = Math.min(page * rowsPerPage, totalCount);

  if (totalCount === 0) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
      <p className="text-sm font-medium text-gray-600">
        Menampilkan <span className="text-gray-900">{from}</span> hingga{" "}
        <span className="text-gray-900">{to}</span> dari{" "}
        <span className="text-gray-900">{totalCount}</span> {itemName}
      </p>
      
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>
        
        <span className="text-sm font-semibold text-gray-700 px-2">
          {page} / {totalPages || 1}
        </span>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          rightIcon={<ChevronRightIcon className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Selanjutnya</span>
        </Button>
      </div>
    </div>
  );
}
