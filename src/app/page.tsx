'use client'

import Game from '@/components/Game'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home({ searchParams }: { searchParams: { width: string, height: string, mineCount: string } }) {
  const { push } = useRouter()
  const [options, setOptions] = useState(() => ({
    width: searchParams.width ? parseInt(searchParams.width) : 10,
    height: searchParams.height ? parseInt(searchParams.height) : 10,
    mineCount: searchParams.mineCount ? parseInt(searchParams.mineCount) : 10,
  }))
  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className='flex flex-col items-center justify-center'>
        <h1 className='text-5xl font-bold mb-2'>Minesweeper</h1>
        <div className='flex items-center mb-10'>
          <div className='mr-2'>Width:</div>
          <input
            type='number'
            className='border border-gray-400 rounded-md p-1 w-20 mr-2 text-black'
            value={options.width.toString()}
            onChange={event => setOptions({ ...options, width: event.target.valueAsNumber })}
          />
          <div className='mr-2'>Height:</div>
          <input
            type='number'
            className='border border-gray-400 rounded-md p-1 w-20 mr-2 text-black'
            value={options.height.toString()}
            onChange={event => setOptions({ ...options, height: event.target.valueAsNumber })}
          />
          <div className='mr-2'>Mines:</div>
          <input
            type='number'
            className='border border-gray-400 rounded-md p-1 w-20 mr-2 text-black'
            value={options.mineCount.toString()}
            onChange={event => setOptions({ ...options, mineCount: event.target.valueAsNumber })}
          />
          <button
            className='border border-gray-400 rounded-md p-1 w-20 mr-2 disabled:opacity-25'
            disabled={((options.width.toString() === searchParams.width || options.width === 10) && (options.height.toString() === searchParams.height || options.height === 10) && (options.mineCount.toString() === searchParams.mineCount || options.mineCount === 10))}
            onClick={() => push(`/?width=${options.width}&height=${options.height}&mineCount=${options.mineCount}`)}
          >
            Change
          </button>
        </div>
      </div>
      <Game
        width={searchParams.width ? parseInt(searchParams.width) : 10}
        height={searchParams.height ? parseInt(searchParams.height) : 10}
        mineCount={searchParams.mineCount ? parseInt(searchParams.mineCount) : 10}
      />
    </main>
  )
}
