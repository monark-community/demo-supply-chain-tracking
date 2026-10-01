"use client"

import { useSyncExternalStore } from "react"

import { seedState } from "./seed"
import type { DemoState } from "./types"

const KEY = "chainproof:demo:v1"

const SERVER_STATE = seedState()
let state: DemoState = SERVER_STATE
let loaded = false
let storageBlocked = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      if (parsed && parsed.v === 1 && parsed.batches && Array.isArray(parsed.order)) state = parsed
    }
  } catch {
    storageBlocked = true
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    storageBlocked = true
  }
}

function emit() {
  for (const l of listeners) l()
}

export function getState(): DemoState {
  load()
  return state
}

/** Replace the state immutably and notify subscribers. */
export function setState(update: (s: DemoState) => DemoState) {
  load()
  state = update(state)
  persist()
  emit()
}

export function resetDemo() {
  state = seedState()
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    storageBlocked = true
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    loaded = false
    load()
    emit()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** Subscribe to the demo ledger. The server (and the first client render) sees the seed state. */
export function useDemo<T>(select: (s: DemoState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(getState()),
    () => select(SERVER_STATE),
  )
}

const noop = () => () => {}
/** True once the client has read localStorage (use it to avoid flashing the wallet gate). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}

export function isStorageBlocked(): boolean {
  load()
  return storageBlocked
}
