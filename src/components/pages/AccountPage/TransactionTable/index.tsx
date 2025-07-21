'use client'

import React, { useState, useEffect } from 'react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useGetTransactionsQuery } from '@/hooks/queries/useGetSignaturesQuery'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import { Columns } from './Columns'

type Props = {
  publicKey: PublicKey
}

const SkeletonTable = (): React.ReactNode => (
  <tbody>
    {[...Array(10)].map((_, idx) => (
      <tr className='hover:bg-gray-50' key={idx}>
        {[...Array(9)].map((_, cellIdx) => (
          <td className='border-y border-gray-200 px-4 py-2 text-sm text-gray-700' key={cellIdx}>
            <div className='h-4 w-full animate-pulse rounded bg-gray-300' />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
)

const TransactionsTable = ({ publicKey }: Props): React.ReactNode => {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, isFetching } = useGetTransactionsQuery({
    address: publicKey,
    page,
  })

  const table = useReactTable({
    data: data?.transactions || [],
    columns: Columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: false,
    initialState: {
      sorting: [
        {
          id: 'time',
          desc: true,
        },
      ],
    },
  })

  useEffect(() => {
    if (error) {
      toast.error('Error fetching transactions')
    }
  }, [error])

  const handleNextPage = (): void => setPage((prev) => (data?.totalPages ? Math.min(prev + 1, data.totalPages) : prev))
  const handlePreviousPage = (): void => setPage((prev) => Math.max(prev - 1, 1))

  return (
    <div className='bg-card w-full rounded-lg border border-gray-100 p-4 shadow-xl'>
      <div className='w-full overflow-x-auto'>
        <table className='min-w-full'>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className='cursor-pointer px-4 py-2 text-left text-sm font-semibold text-gray-600'
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() ? header.column.getIsSorted() === 'asc' ? <span> 🔼</span> : <span> 🔽</span> : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          {isLoading || isFetching ? (
            <SkeletonTable />
          ) : (
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr className='hover:bg-gray-50' key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const className = cell.column.columnDef.meta || '' // Get the custom class
                      return (
                        <td className={`truncate border-y border-gray-200 px-4 py-2 text-sm text-gray-700 ${className}`} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className='px-4 py-2 text-center text-sm text-gray-500' colSpan={table.getHeaderGroups()[0]?.headers.length || 1}>
                    No transactions performed
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
      <div className='mt-4 flex items-center justify-between'>
        <div className='text-gray-500'>
          Page {page} of {data?.totalPages || 1}
        </div>
        <div className='flex gap-2'>
          {page !== 1 && (
            <button
              className='rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300'
              disabled={page === 1 || isFetching}
              onClick={handlePreviousPage}
              type='button'
            >
              Previous
            </button>
          )}
          {page !== data?.totalPages && (
            <button
              className='rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300'
              disabled={page === data?.totalPages || isFetching}
              onClick={handleNextPage}
              type='button'
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransactionsTable
