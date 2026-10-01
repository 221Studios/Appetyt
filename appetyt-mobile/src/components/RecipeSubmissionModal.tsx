import React, { useCallback, useEffect, useState } from 'react';
import { createRecipeSubmission, listMyRecipeSubmissions, RecipeSubmission } from '../data/recipeSubmissions';
import { useTranslation } from '../i18n';

interface RecipeSubmissionModalProps {
  onClose: () => void;
  onShowToast: (message: string) => void;
}

function statusLabel(status: RecipeSubmission['status'], language: string) {
  const labels: Record<string, string> = language === 'pl'
    ? {submitted: 'W kolejce', processing: 'Pobieranie danych', awaiting_review: 'Czeka na weryfikację', approved: 'Opublikowany', rejected: 'Odrzucony', failed: 'Nie udało się pobrać'}
    : {submitted: 'Queued', processing: 'Fetching data', awaiting_review: 'Awaiting review', approved: 'Published', rejected: 'Rejected', failed: 'Fetch failed'};
  return labels[status] || status;
}

export const RecipeSubmissionModal: React.FC<RecipeSubmissionModalProps> = ({onClose, onShowToast}) => {
  const {language, t} = useTranslation();
  const [url, setUrl] = useState('');
  const [submissions, setSubmissions] = useState<RecipeSubmission[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const refresh = useCallback(() => {
    void listMyRecipeSubmissions()
      .then(setSubmissions)
      .catch(() => onShowToast(t('submissionLoadError')));
  }, [onShowToast, t]);

  useEffect(() => refresh(), [refresh]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;
    setIsBusy(true);
    try {
      await createRecipeSubmission(url.trim());
      setUrl('');
      onShowToast(t('submissionSent'));
      refresh();
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : t('submissionError'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-inverse-surface/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-surface rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-surface-container">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{t('submitRecipe')}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t('submitRecipeHint')}</p>
          </div>
          <button onClick={onClose} aria-label={t('close')} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface" type="button">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="min-h-0 p-5 flex-1 overflow-y-auto no-scrollbar">
          <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
            <label htmlFor="recipe-submission-url" className="font-label-md text-label-md font-semibold text-on-surface">{t('recipeLink')}</label>
            <input id="recipe-submission-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" className="h-12 rounded-xl bg-surface-container-lowest border border-surface-container-high px-3 text-on-surface outline-none focus:border-primary" />
            <button disabled={isBusy} type="submit" className="h-11 rounded-xl bg-primary text-on-primary font-label-md font-bold disabled:opacity-50">{isBusy ? '…' : t('sendForReview')}</button>
          </form>
          <div className="mt-6 flex flex-col gap-2">
            <h4 className="font-label-lg text-label-lg font-bold text-on-surface">{t('yourSubmissions')}</h4>
            {submissions.length === 0 ? <p className="font-body-sm text-body-sm text-on-surface-variant">{t('noSubmissions')}</p> : submissions.map((submission) => (
              <div key={submission.id} className="rounded-xl bg-surface-container-lowest border border-surface-container-high/50 p-3">
                <p className="font-label-md text-label-md text-on-surface break-all">{submission.submitted_url}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-body-sm text-body-sm text-primary">{statusLabel(submission.status, language)}</span>
                  {submission.latest_attempt?.extracted_title ? <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{submission.latest_attempt.extracted_title}</span> : null}
                </div>
                {submission.rejection_reason ? <p className="font-body-sm text-body-sm text-error mt-1">{submission.rejection_reason}</p> : null}
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 pt-2 pb-safe-action-bar shrink-0 border-t border-surface-container bg-surface">
          <button onClick={onClose} className="w-full h-12 rounded-xl bg-surface-container text-on-surface font-label-lg font-bold" type="button">{t('close')}</button>
        </div>
      </div>
    </div>
  );
};
