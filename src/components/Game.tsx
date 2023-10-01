'use client'

import { type CellState, useMinesweeperGame } from "@/game"
import { useEffect } from "react"

export type GameProps = {
  readonly width?: number
  readonly height?: number
  readonly mineCount?: number
}

const cellClasses = ['cell', 'w-10', 'h-10', 'border', 'border-slate-300', 'bg-white', 'text-black', 'text-lg', 'font-bold', 'flex', 'items-center', 'justify-center']

const getCellClasses = (cell: CellState) => {
  const conditionalClasses = [
    [cell.revealed && !cell.mined, 'bg-slate-300 border-slate-400'],
    [cell.revealed && cell.mined, 'bg-red-200'],
    [cell.revealed && cell.adjacentMineCount === 1, 'text-blue-500'],
    [cell.revealed && cell.adjacentMineCount === 2, 'text-green-500'],
    [cell.revealed && cell.adjacentMineCount === 3, 'text-red-500'],
    [cell.revealed && cell.adjacentMineCount === 4, 'text-purple-500'],
  ].filter(([condition]) => condition).map(([, className]) => className)

  return [...cellClasses, ...conditionalClasses].join(' ')
}

const getCellContent = (cell: CellState) => {
  if (cell.flagged) {
    return '🚩'
  }

  if (cell.revealed && cell.mined) {
    return '💣'
  }

  if (cell.revealed && cell.adjacentMineCount > 0) {
    return cell.adjacentMineCount
  }

  return null
}

const Game = ({ width = 10, height = 10, mineCount = 10 }: GameProps) => {
  const { state, elapsedTime, mapRows, create, reset } = useMinesweeperGame()

  useEffect(() => {
    create({ width, height, mineCount })
  }, [create, width, height, mineCount])

  return (
    <div className='game'>
      <div className='controls'>
        <div className='flex justify-between mb-2'>
          <div className='flex items-center mr-2'>
            <div className='mr-2'>Mines/Flags:</div>
            <div className='text-xl font-bold'>{state.mineCount}/{state.flagCount}</div>
          </div>
          <div className='flex items-center mr-2'>
            <div className='mr-2'>Elapsed:</div>
            <div className='text-xl font-bold'>{elapsedTime}</div>
          </div>
          <button
            className='border border-gray-400 rounded-md p-1 w-20 mr-2'
            onClick={() => reset()}
          >
            Reset
          </button>
        </div>
      </div>
      <div className='board'>
        {mapRows(({ mapCells, rowIndex }) => (
          <div key={rowIndex} className='row flex'>
            {mapCells(({ cell, cellProps, columnIndex }) => (
              <div
                key={columnIndex}
                className={getCellClasses(cell)}
                {...cellProps}
              >
                {getCellContent(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className='status'>
        {state.status === 'won' && (
          <div className='text-5xl mt-2 text-green-500 text-center'>
            <div className='mr-2'>You won!</div>
          </div>
        )}
        {state.status === 'lost' && (
          <div className='text-5xl mt-2 text-red-500 text-center'>
            You lost!
          </div>
        )}
      </div>
    </div>
  )
}

export default Game
