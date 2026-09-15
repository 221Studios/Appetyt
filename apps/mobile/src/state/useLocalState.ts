import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useReducer, useRef, useState } from 'react';

import { INITIAL_LOCAL_STATE, LocalState, localReducer } from './localState';

const STORAGE_KEY = '@appetyt/local-state-v1';
const WRITE_ATTEMPTS = 2;

export async function persistLocalState(state: LocalState): Promise<void> {
  const serialized = JSON.stringify(state);
  let lastError: unknown;
  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, serialized);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function useLocalState() {
  const [state, dispatch] = useReducer(localReducer, INITIAL_LOCAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState(false);
  const writeVersion = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) {
          try {
            dispatch({ type: 'hydrate', state: JSON.parse(value) as Partial<LocalState> });
          } catch {
            // Ignore an invalid old snapshot and use safe defaults.
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const version = writeVersion.current + 1;
    writeVersion.current = version;
    let active = true;
    persistLocalState(state)
      .then(() => {
        if (active && writeVersion.current === version) setPersistenceError(false);
      })
      .catch(() => {
        if (active && writeVersion.current === version) setPersistenceError(true);
      });
    return () => {
      active = false;
    };
  }, [hydrated, state]);

  return { state, dispatch, hydrated, persistenceError };
}
