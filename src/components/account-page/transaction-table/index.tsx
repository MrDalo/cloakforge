'use client'

import React, { useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { columns } from './columns'
import { useGetTransactionsQuery } from '@/hooks/queries/useGetSignaturesQuery'
import LoadingSpinner from '@/components/core/loading-spinner'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'

type Props = {
  publicKey: PublicKey
}

const TransactionsTable = ({ publicKey }: Props): React.ReactNode => {
  const { data, isLoading, error } = useGetTransactionsQuery({
    address: publicKey,
  })

  const table = useReactTable({
    data: data || [],
    columns,
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

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <p className='text-destructive-foreground'>
        Error loading transactions: {String(error)}
      </p>
    )
  }

  return (
    <div className='w-full rounded-lg border border-gray-100 bg-card p-4 shadow-xl'>
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
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === 'asc' ? (
                        <span> 🔼</span>
                      ) : (
                        <span> 🔽</span>
                      )
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className='hover:bg-gray-50' key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const className = cell.column.columnDef.meta || '' // Get the custom class
                  return (
                    <td
                      className={`truncate border-y border-gray-200 px-4 py-2 text-sm text-gray-700 ${className}`}
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TransactionsTable
