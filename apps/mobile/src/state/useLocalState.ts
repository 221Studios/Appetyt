import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useReducer, useState } from 'react';

import { INITIAL_LOCAL_STATE, LocalState, localReducer } from './localState';

const STORAGE_KEY = '@appetyt/local-state-v1';

export function useLocalState() {
  const [state, dispatch] = useReducer(localReducer, INITIAL_LOCAL_STATE);
  const [hydrated, setHydrated] = useState(false);

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
    if (hydrated) {
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  return { state, dispatch, hydrated };
}
