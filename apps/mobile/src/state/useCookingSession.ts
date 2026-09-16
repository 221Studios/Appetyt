import { useEffect, useState } from 'react';

import { RecipeDetail } from '../api/types';

export function useCookingSession() {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!recipe || !running || seconds <= 0) return undefined;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [recipe, running, seconds]);

  const start = (next: RecipeDetail) => {
    setRecipe(next);
    setIndex(0);
    setSeconds((next.steps[0]?.duration_minutes ?? 4) * 60);
    setRunning(true);
    setModalOpen(true);
  };

  const goTo = (nextIndex: number) => {
    if (!recipe) return;
    const clamped = Math.max(0, Math.min(recipe.steps.length - 1, nextIndex));
    setIndex(clamped);
    setSeconds((recipe.steps[clamped]?.duration_minutes ?? 4) * 60);
    setRunning(true);
  };

  const finish = () => {
    setRecipe(null);
    setIndex(0);
    setSeconds(0);
    setRunning(false);
    setModalOpen(false);
  };

  return {
    recipe,
    index,
    seconds,
    running,
    modalOpen,
    start,
    goTo,
    setSeconds,
    setRunning,
    setModalOpen,
    finish,
  };
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
}
