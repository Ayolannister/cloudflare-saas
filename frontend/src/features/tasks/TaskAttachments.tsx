import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import type { Attachment } from '../../lib/api';
import { formatBytes, safeFilename } from '../../lib/format';
import { useAttachFile, useDetachFile, useDownloadFile, useFiles, useUploadFile } from '../../lib/queries';
import { toast, toastError } from '../../stores/ui';
import { checkFile } from '../files/fileRules';

interface TaskAttachmentsProps {
  taskId: number;
  attachments: Attachment[] | undefined;
  loading: boolean;
}

export function TaskAttachments({ taskId, attachments = [], loading }: TaskAttachmentsProps) {
  const files = useFiles();
  const attach = useAttachFile(taskId);
  const detach = useDetachFile(taskId);
  const upload = useUploadFile();
  const download = useDownloadFile();
  const [selected, setSelected] = useState('');
  const [busyFileId, setBusyFileId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const attachedIds = new Set(attachments.map((file) => file.id));
  const available = (files.data ?? []).filter((file) => !attachedIds.has(file.id));
  const selectedFile = available.find((file) => String(file.id) === selected);

  async function handleDownload(filename: string) {
    try {
      await download(filename);
    } catch (error) {
      toastError(error instanceof Error ? error.message : `Could not download ${filename}.`);
    }
  }

  function handleUploadAndAttach(file: File) {
    const problem = checkFile(file);
    if (problem) {
      toastError(problem);
      return;
    }
    const filename = safeFilename(file.name);
    upload.mutate(
      { file, filename },
      {
        onSuccess: (stored) => {
          attach.mutate(stored, {
            onSuccess: () => toast(filename === file.name ? `Attached ${filename}.` : `Saved as ${filename} and attached.`),
          });
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-rule pt-3">
      {loading ? (
        <p className="text-sm text-muted">Loading attached files</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted">No files attached yet.</p>
      ) : (
        <ul className="flex flex-col">
          {attachments.map((file) => (
            <li key={file.id} className="flex items-center gap-3 py-1.5">
              <Icon name="file" className="shrink-0 text-muted" />
              <button
                type="button"
                onClick={() => void handleDownload(file.filename)}
                className="min-w-0 flex-1 truncate text-left text-sm font-medium underline-offset-2 hover:underline"
                title={`Download ${file.filename}`}
              >
                {file.filename}
              </button>
              <span className="text-xs text-muted tabular-nums">{formatBytes(file.size)}</span>
              <button
                type="button"
                className="btn btn-quiet h-8 px-2.5 text-xs"
                disabled={busyFileId === file.id}
                onClick={() => {
                  setBusyFileId(file.id);
                  detach.mutate(file, { onSettled: () => setBusyFileId(null) });
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`attach-${taskId}`} className="sr-only">
          Choose a stored file to attach
        </label>
        <select
          id={`attach-${taskId}`}
          className="field h-9 w-auto max-w-full min-w-0 flex-1 text-sm sm:max-w-xs"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          disabled={files.isLoading || available.length === 0}
        >
          <option value="">
            {files.isLoading ? 'Loading files' : available.length === 0 ? 'No other stored files' : 'Choose a stored file'}
          </option>
          {available.map((file) => (
            <option key={file.id} value={file.id}>
              {file.filename}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary h-9"
          disabled={!selectedFile || attach.isPending}
          onClick={() => {
            if (!selectedFile) return;
            attach.mutate(selectedFile, {
              onSuccess: () => {
                setSelected('');
                toast(`Attached ${selectedFile.filename}.`);
              },
            });
          }}
        >
          <Icon name="clip" />
          Attach
        </button>
        <span className="text-sm text-muted">or</span>
        <button
          type="button"
          className="btn btn-quiet h-9"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          <Icon name="upload" />
          {upload.isPending ? 'Uploading' : 'Upload a new file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) handleUploadAndAttach(file);
          }}
        />
      </div>
      {!files.isLoading && (files.data?.length ?? 0) === 0 && (
        <p className="text-xs text-muted">
          Files you upload here also appear in{' '}
          <Link to="/files" className="font-semibold text-ink underline underline-offset-2">
            Files
          </Link>
          .
        </p>
      )}
    </div>
  );
}
