import { type MouseEvent, useEffect, useState, useCallback } from "react"

export type CellState = {
  readonly mined: boolean
  readonly revealed: boolean
  readonly flagged: boolean
  readonly adjacentMineCount: number
}

export type GameStatus = 'pending' | 'won' | 'lost'

export type GameState = {
  readonly width: number
  readonly height: number
  readonly status: GameStatus
  readonly mineCount: number
  readonly flagCount: number
  readonly startTime: string
  readonly endTime?: string
  readonly cells: CellState[][]
}

export type GameOptions = {
  readonly width: number
  readonly height: number
  readonly mineCount: number
}

const isAdjacent = (rowIndex: number, columnIndex: number, otherRowIndex: number, otherColumnIndex: number): boolean => {
  return (
    rowIndex === otherRowIndex - 1 && columnIndex === otherColumnIndex - 1 ||
    rowIndex === otherRowIndex - 1 && columnIndex === otherColumnIndex ||
    rowIndex === otherRowIndex - 1 && columnIndex === otherColumnIndex + 1 ||
    rowIndex === otherRowIndex && columnIndex === otherColumnIndex - 1 ||
    rowIndex === otherRowIndex && columnIndex === otherColumnIndex + 1 ||
    rowIndex === otherRowIndex + 1 && columnIndex === otherColumnIndex - 1 ||
    rowIndex === otherRowIndex + 1 && columnIndex === otherColumnIndex ||
    rowIndex === otherRowIndex + 1 && columnIndex === otherColumnIndex + 1
  )
}

const placeMine = (gameState: GameState): GameState => {
  const mineRowIndex = Math.floor(Math.random() * gameState.height);
  const mineColumnIndex = Math.floor(Math.random() * gameState.width);

  if (gameState.cells[mineRowIndex][mineColumnIndex].mined) {
    return placeMine(gameState);
  }

  const cells = gameState.cells
    .map((row, rowIndex) => row
      .map((cell, columnIndex) => {
        const mined = cell.mined || (rowIndex === mineRowIndex && columnIndex === mineColumnIndex)
        const adjacentMineCount = cell.adjacentMineCount + (isAdjacent(rowIndex, columnIndex, mineRowIndex, mineColumnIndex) ? 1 : 0)

        if (mined === cell.mined && adjacentMineCount === cell.adjacentMineCount) {
          return cell
        }

        return { ...cell, mined, adjacentMineCount }
      })
    )

  return {
    ...gameState,
    cells,
    mineCount: gameState.mineCount + 1,
  }
}

const placeMines = (gameState: GameState, targetMineCount: number): GameState => {
  if (gameState.mineCount >= targetMineCount) {
    return gameState
  }

  return placeMines(placeMine(gameState), targetMineCount)
}

const createGameState = (width: number, height: number, mineCount: number): GameState => {
  const cells: CellState[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => ({
    mined: false,
    revealed: false,
    flagged: false,
    adjacentMineCount: 0
  })))

  const gameState: GameState = {
    width,
    height,
    cells,
    status: 'pending',
    mineCount: 0,
    flagCount: 0,
    startTime: new Date().toISOString(),
    endTime: undefined,
  }

  return placeMines(gameState, mineCount)
}

const isWon = (gameState: GameState): boolean => {
  if (gameState.status !== 'pending') {
    return false
  }

  const allCellsRevealed = gameState.cells
    .every(row => row
      .every(cell => cell.revealed || cell.mined)
    )

  return allCellsRevealed && gameState.flagCount === gameState.mineCount
}

const finishWithStatus = (gameState: GameState, status: GameStatus): GameState => {
  return {
    ...gameState,
    status,
    endTime: new Date().toISOString(),
  }
}

const validateWin = (gameState: GameState): GameState => {
  if (isWon(gameState)) {
    return finishWithStatus(gameState, 'won')
  }

  return gameState
}

const toggleFlag = (gameState: GameState, rowIndex: number, columnIndex: number): GameState => {
  if (rowIndex < 0 || rowIndex >= gameState.height || columnIndex < 0 || columnIndex >= gameState.width || gameState.status !== 'pending' || gameState.flagCount >= gameState.mineCount) {
    return gameState
  }

  const row = gameState.cells[rowIndex]
  const cell = row[columnIndex]

  if (cell.revealed) {
    return gameState
  }

  const cells = gameState.cells
    .with(
      rowIndex,
      row.with(columnIndex, {
        ...cell,
        flagged: !cell.flagged
      })
    )

  const flagCount = gameState.flagCount + (cell.flagged ? -1 : 1)

  return validateWin({
    ...gameState,
    flagCount,
    cells,
  })
}

const revealCell = (gameState: GameState, rowIndex: number, columnIndex: number): GameState => {
  if (rowIndex < 0 || rowIndex >= gameState.height || columnIndex < 0 || columnIndex >= gameState.width || gameState.status !== 'pending') {
    return gameState
  }

  const row = gameState.cells[rowIndex]
  const cell = row[columnIndex]

  if (cell.revealed) {
    return gameState
  }

  const cells = gameState.cells
    .with(
      rowIndex,
      row.with(columnIndex, {
        ...cell,
        revealed: true
      })
    )

  if (cell.mined) {
    return finishWithStatus({
      ...gameState,
      cells,
    }, 'lost')
  }

  const newGameState = validateWin({
    ...gameState,
    cells,
  })

  if (cell.adjacentMineCount !== 0) {
    return newGameState
  }

  const adjacentCells = [
    [rowIndex - 1, columnIndex - 1],
    [rowIndex - 1, columnIndex],
    [rowIndex - 1, columnIndex + 1],
    [rowIndex, columnIndex - 1],
    [rowIndex, columnIndex + 1],
    [rowIndex + 1, columnIndex - 1],
    [rowIndex + 1, columnIndex],
    [rowIndex + 1, columnIndex + 1],
  ]

  return adjacentCells.reduce((gameState, [rowIndex, columnIndex]) => revealCell(gameState, rowIndex, columnIndex), newGameState)
}

const emptyGameState = createGameState(0, 0, 0)

export type CellHandle = {
  readonly cell: CellState
  readonly cellProps: {
    readonly onMouseUp: (event: MouseEvent<HTMLDivElement>) => void
    readonly onContextMenu: (event: MouseEvent<HTMLDivElement>) => void
  }
  readonly rowIndex: number
  readonly columnIndex: number
}

export type RowHandle = {
  readonly mapCells: (mapFn: (cell: CellHandle) => JSX.Element) => JSX.Element[]
  readonly rowIndex: number
}

export const useMinesweeperGame = () => {
  const [state, setState] = useState(() => emptyGameState)
  const [elapsedTime, setElapsedTime] = useState('00:00:00')

  useEffect(() => {
    const getElapsedTime = () => {
      const startTime = new Date(state.startTime)
      const now = state.endTime ? new Date(state.endTime) : new Date()
      const elapsedMilliseconds = now.getTime() - startTime.getTime()
      return new Date(elapsedMilliseconds).toISOString().substring(11, 19)
    }

    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime())
    }, 200)

    return () => clearInterval(interval)
  }, [state.startTime, state.endTime])

  const onMouseUp = (rowIndex: number, columnIndex: number) => (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()

    if (state.status !== 'pending') {
      return
    }

    if (event.button === 2) {
      setState(state => toggleFlag(state, rowIndex, columnIndex))
      return
    }

    if (event.button === 0) {
      setState(state => revealCell(state, rowIndex, columnIndex))
      return
    }
  }

  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const mapRows = (mapFn: (row: RowHandle) => JSX.Element) => {
    return state.cells.map((row, rowIndex) => {
      const rowHandle: RowHandle = {
        mapCells: (mapFn) => {
          return row.map((cell, index) => {
            const cellHandle: CellHandle = {
              cell,
              cellProps: {
                onMouseUp: onMouseUp(rowIndex, index),
                onContextMenu,
              },
              rowIndex: index,
              columnIndex: index,
            }

            return mapFn(cellHandle)
          })
        },
        rowIndex: rowIndex,
      }

      return mapFn(rowHandle)
    })
  }

  const create = useCallback((options: GameOptions) => setState(() => createGameState(options.width, options.height, options.mineCount)), [])
  const reset = useCallback(() => setState(() => createGameState(state.width, state.height, state.mineCount)), [state.width, state.height, state.mineCount])

  return {
    state,
    elapsedTime,
    mapRows,
    create,
    reset,
  }
}
