import React, { useCallback, useEffect, useState } from 'react';
import {
  AdminRecipeSubmission,
  approveRecipeSubmission,
  listAdminRecipeSubmissions,
  rejectRecipeSubmission,
  retryRecipeSubmission,
  uploadRecipeSubmissionImage,
} from '../data/recipeSubmissions';
import { useTranslation } from '../i18n';

interface AdminSubmissionsModalProps {
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export const AdminSubmissionsModal: React.FC<AdminSubmissionsModalProps> = ({onClose, onShowToast}) => {
  const {t} = useTranslation();
  const [rows, setRows] = useState<AdminRecipeSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [note, setNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const selected = rows.find((row) => row.id === selectedId) || null;
  const refresh = useCallback(() => {
    void listAdminRecipeSubmissions()
      .then((items) => {
        const pending = items.filter((item) => item.status === 'awaiting_review' || item.status === 'failed');
        setRows(pending);
        setSelectedId((current) => current && pending.some((item) => item.id === current) ? current : pending[0]?.id || null);
      })
      .catch((error) => onShowToast(error instanceof Error ? error.message : t('moderationLoadError')));
  }, [onShowToast, t]);

  useEffect(() => refresh(), [refresh]);
  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title_override || selected.extracted_title || '');
    setAuthor(selected.author_override || selected.extracted_author || '');
    setImageUrl(selected.image_override_url || selected.source_image_url || '');
    setNote(selected.admin_note || '');
    setRejectReason('');
  }, [selected]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setIsBusy(true);
    try {
      await action();
      onShowToast(success);
      refresh();
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : t('moderationError'));
    } finally {
      setIsBusy(false);
    }
  };

  const approve = () => {
    if (!selected) return;
    void run(() => approveRecipeSubmission(selected.id, {
      title: title.trim() || undefined,
      author_name: author.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      admin_note: note.trim() || undefined,
    }), t('submissionApproved'));
  };

  const reject = () => {
    if (!selected || !rejectReason.trim()) return;
    void run(() => rejectRecipeSubmission(selected.id, rejectReason.trim()), t('submissionRejected'));
  };

  const upload = (file: File | undefined) => {
    if (!selected || !file) return;
    void run(async () => {
      const result = await uploadRecipeSubmissionImage(selected.id, file);
      setImageUrl(result.image_override_url || '');
    }, t('coverSaved'));
  };

  const retry = () => {
    if (!selected) return;
    void run(() => retryRecipeSubmission(selected.id), t('submissionRetrying'));
  };

  return (
    <div className="fixed inset-0 z-[70] bg-inverse-surface/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[720px] bg-surface rounded-t-3xl sm:rounded-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-surface-container">
          <div><h3 className="font-headline-sm text-headline-sm text-on-surface">{t('moderation')}</h3><p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t('moderationHint')}</p></div>
          <button onClick={onClose} aria-label={t('close')} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface" type="button"><span className="material-symbols-outlined text-[20px]">close</span></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-5 grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col gap-2">
            {rows.length === 0 ? <p className="font-body-sm text-body-sm text-on-surface-variant">{t('noPendingSubmissions')}</p> : rows.map((row) => (
              <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} className={`text-left rounded-xl p-3 border ${row.id === selectedId ? 'border-primary bg-primary/10' : 'border-surface-container-high bg-surface-container-lowest'}`}>
                <span className="font-label-md text-label-md font-semibold text-on-surface block truncate">{row.extracted_title || row.submitted_url}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1 truncate">{row.extracted_author || row.submitted_url}</span>
                {row.content_flags.length ? <span className="font-label-sm text-label-sm text-error block mt-1">{row.content_flags.join(', ')}</span> : null}
              </button>
            ))}
          </div>
          {selected ? (
            <div className="flex flex-col gap-3">
              <a href={selected.final_url || selected.submitted_url} target="_blank" rel="noopener noreferrer" className="font-body-sm text-body-sm text-primary break-all">{selected.final_url || selected.submitted_url}</a>
              <div className="grid grid-cols-1 gap-2">
                <label className="font-label-sm text-label-sm text-on-surface">{t('title')}<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-surface-container-high bg-surface-container-lowest px-2 text-on-surface" /></label>
                <label className="font-label-sm text-label-sm text-on-surface">{t('author')}<input value={author} onChange={(event) => setAuthor(event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-surface-container-high bg-surface-container-lowest px-2 text-on-surface" /></label>
                <label className="font-label-sm text-label-sm text-on-surface">{t('coverUrl')}<input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder={t('coverUrlHint')} className="mt-1 w-full h-10 rounded-lg border border-surface-container-high bg-surface-container-lowest px-2 text-on-surface" /></label>
                <label className="font-label-sm text-label-sm text-on-surface">{t('adminNote')}<textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full min-h-16 rounded-lg border border-surface-container-high bg-surface-container-lowest p-2 text-on-surface" /></label>
              </div>
              {imageUrl ? <img src={imageUrl} alt="" className="h-32 w-full object-cover rounded-xl bg-surface-container" /> : null}
              <label className="h-10 rounded-xl bg-surface-container text-on-surface font-label-md font-bold flex items-center justify-center cursor-pointer">{t('uploadCover')}<input type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /></label>
              {selected.content_flags.length ? <p className="font-body-sm text-body-sm text-error">{t('contentFlags')}: {selected.content_flags.join(', ')}</p> : null}
              <p className="font-body-sm text-body-sm text-on-surface-variant">{t('confidence')}: {selected.recipe_confidence === null ? '—' : `${Math.round(selected.recipe_confidence * 100)}%`}</p>
              {selected.status === 'failed' ? <button disabled={isBusy} onClick={retry} type="button" className="h-11 rounded-xl bg-primary text-on-primary font-label-md font-bold disabled:opacity-50">{t('retry')}</button> : <div className="grid grid-cols-2 gap-2"><button disabled={isBusy} onClick={approve} type="button" className="h-11 rounded-xl bg-primary text-on-primary font-label-md font-bold disabled:opacity-50">{t('approve')}</button><button disabled={isBusy || !rejectReason.trim()} onClick={reject} type="button" className="h-11 rounded-xl border border-error text-error font-label-md font-bold disabled:opacity-50">{t('reject')}</button></div>}
              <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder={t('rejectReason')} className="h-10 rounded-lg border border-surface-container-high bg-surface-container-lowest px-2 text-on-surface" />
            </div>
          ) : null}
        </div>
        <div className="p-4 pt-2 pb-safe-action-bar shrink-0 border-t border-surface-container bg-surface flex gap-2"><button onClick={refresh} type="button" className="flex-1 h-12 rounded-xl bg-surface-container text-on-surface font-label-lg font-bold">{t('refresh')}</button><button onClick={onClose} type="button" className="flex-1 h-12 rounded-xl bg-primary text-on-primary font-label-lg font-bold">{t('close')}</button></div>
      </div>
    </div>
  );
};
