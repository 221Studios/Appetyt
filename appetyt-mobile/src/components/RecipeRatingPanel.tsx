import React, { useEffect, useState } from 'react';
import { useTranslation } from '../i18n';
import {
  deleteRecipeRating,
  getRecipeRating,
  isRatingAuthError,
  RecipeRatingSummary,
  saveRecipeRating,
} from '../data/ratings';

interface RecipeRatingPanelProps {
  recipeId: string;
  onOpenSettings: () => void;
}

const SCORE_OPTIONS = Array.from({length: 10}, (_, index) => index + 1);

export const RecipeRatingPanel: React.FC<RecipeRatingPanelProps> = ({ recipeId, onOpenSettings }) => {
  const { t, count } = useTranslation();
  const [summary, setSummary] = useState<RecipeRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setNeedsLogin(false);
    void getRecipeRating(recipeId)
      .then((next) => {
        if (mounted) setSummary(next);
      })
      .catch(() => {
        if (mounted) setError(t('ratingLoadError'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [recipeId, t]);

  const save = async (score: number) => {
    setPendingScore(score);
    setError(null);
    setNeedsLogin(false);
    try {
      setSummary(await saveRecipeRating(recipeId, score));
    } catch (requestError) {
      if (isRatingAuthError(requestError)) setNeedsLogin(true);
      else setError(t('ratingSaveError'));
    } finally {
      setPendingScore(null);
    }
  };

  const remove = async () => {
    setPendingScore(0);
    setError(null);
    try {
      await deleteRecipeRating(recipeId);
      setSummary(await getRecipeRating(recipeId));
    } catch (requestError) {
      if (isRatingAuthError(requestError)) setNeedsLogin(true);
      else setError(t('ratingSaveError'));
    } finally {
      setPendingScore(null);
    }
  };

  const averageLabel = summary?.averageScore === null || summary?.averageScore === undefined
    ? t('noRatingsYet')
    : `${summary.averageScore.toFixed(1)}/10 · ${summary.ratingCount} ${count('rating', summary.ratingCount)}`;

  return (
    <section className="mx-4 mt-5 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{t('rateRecipe')}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{averageLabel}</p>
        </div>
        <span className="material-symbols-outlined text-primary text-[24px]">grade</span>
      </div>

      {loading ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-3" aria-live="polite">…</p>
      ) : (
        <>
          <p className="font-label-md text-label-md text-on-surface-variant mt-4 mb-2">{t('ratingScale')}</p>
          <div className="grid grid-cols-5 gap-2" role="group" aria-label={t('ratingScale')}>
            {SCORE_OPTIONS.map((score) => {
              const isSelected = summary?.viewerScore === score;
              return (
                <button
                  key={score}
                  type="button"
                  aria-label={`${score}/10`}
                  aria-pressed={isSelected}
                  disabled={pendingScore !== null}
                  onClick={() => void save(score)}
                  className={`h-10 rounded-xl font-label-md text-label-md font-bold transition-colors disabled:opacity-50 ${
                    isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'
                  }`}
                >
                  {score}
                </button>
              );
            })}
          </div>
          {summary?.viewerScore !== null && summary?.viewerScore !== undefined ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {t('yourRating')}: {summary.viewerScore}/10
              </span>
              <button
                type="button"
                disabled={pendingScore !== null}
                onClick={() => void remove()}
                className="font-label-md text-label-md text-primary font-bold disabled:opacity-50"
              >
                {t('removeRating')}
              </button>
            </div>
          ) : null}
        </>
      )}

      {needsLogin ? (
        <div className="mt-3 flex items-center justify-between gap-3 p-3 rounded-xl bg-primary/10">
          <span className="font-body-sm text-body-sm text-on-surface-variant">{t('loginToRate')}</span>
          <button type="button" onClick={onOpenSettings} className="shrink-0 font-label-md text-label-md text-primary font-bold">
            {t('loginWithGoogle')}
          </button>
        </div>
      ) : null}
      {error ? <p className="font-body-sm text-body-sm text-error mt-3" role="alert">{error}</p> : null}
    </section>
  );
};
