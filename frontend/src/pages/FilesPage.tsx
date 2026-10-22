import { useRef, useState, type DragEvent, type FormEvent } from 'react';
import { ConfirmButton } from '../components/ConfirmButton';
import { Icon } from '../components/Icon';
import { EmptyState, InlineError } from '../components/Status';
import { checkFile, checkFilename } from '../features/files/fileRules';
import { MAX_FILE_SIZE, type StoredFile } from '../lib/api';
import { formatBytes, formatDateTime, plural, safeFilename } from '../lib/format';
import { useDeleteFile, useDownloadFile, useFiles, useUploadFile } from '../lib/queries';
import { toast, toastError } from '../stores/ui';

export function FilesPage() {
  const files = useFiles();
  const total = (files.data ?? []).reduce((sum, file) => sum + file.size, 0);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[2rem] leading-[1.1] font-[750] tracking-[-0.025em] sm:text-[2.5rem]">Files</h1>
        <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
          Everything you have uploaded. Only you can see these files. Attach them to tasks from any project.
        </p>
      </header>

      <UploadPanel />

      <section aria-labelledby="stored-files" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="stored-files" className="text-sm font-semibold text-muted">
            {files.data ? `${plural(files.data.length, 'file')}, ${formatBytes(total)} in total` : 'Your files'}
          </h2>
        </div>
        {files.isError ? (
          <InlineError message={files.error.message} onRetry={() => void files.refetch()} />
        ) : files.isLoading ? (
          <p className="text-sm text-muted">Loading files</p>
        ) : files.data?.length === 0 ? (
          <EmptyState title="Nothing uploaded yet">
            <p>Upload a file above, or upload straight onto a task from its Files link.</p>
          </EmptyState>
        ) : (
          <ul className="panel divide-y divide-rule">
            {files.data?.map((file) => <FileRow key={file.id} file={file} />)}
          </ul>
        )}
      </section>
    </main>
  );
}

function UploadPanel() {
  const upload = useUploadFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [dragging, setDragging] = useState(false);

  const nameProblem = picked ? checkFilename(filename) : null;

  function pick(file: File | undefined) {
    if (!file) return;
    const problem = checkFile(file);
    if (problem) {
      toastError(problem);
      return;
    }
    setPicked(file);
    setFilename(safeFilename(file.name));
  }

  function reset() {
    setPicked(null);
    setFilename('');
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files?.[0]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!picked || nameProblem) return;
    upload.mutate(
      { file: picked, filename },
      {
        onSuccess: (stored) => {
          toast(`Uploaded ${stored.filename}.`);
          reset();
        },
      },
    );
  }

  if (picked) {
    return (
      <form onSubmit={handleSubmit} className="panel flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Icon name="file" width={20} height={20} className="mt-0.5 shrink-0 text-muted" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{picked.name}</p>
            <p className="text-sm text-muted">{formatBytes(picked.size)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="upload-name" className="text-sm font-semibold">
            Save as
          </label>
          <input
            id="upload-name"
            className="field"
            value={filename}
            onChange={(event) => setFilename(event.target.value)}
            aria-invalid={Boolean(nameProblem)}
            aria-describedby="upload-name-help"
          />
          <p id="upload-name-help" className={`text-xs ${nameProblem ? 'text-danger-ink' : 'text-muted'}`}>
            {nameProblem ?? 'Names must be unique in your files.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={Boolean(nameProblem) || upload.isPending}>
            <Icon name="upload" />
            {upload.isPending ? 'Uploading' : 'Upload file'}
          </button>
          <button type="button" className="btn btn-quiet" onClick={reset} disabled={upload.isPending}>
            Choose another
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-start gap-4 rounded-[14px] border-2 border-dashed p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${
        dragging ? 'border-ink bg-surface' : 'border-rule'
      }`}
    >
      <div>
        <p className="font-semibold">Drop a file here to upload it</p>
        <p className="text-sm text-muted">One file at a time, up to {formatBytes(MAX_FILE_SIZE)}.</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
        <Icon name="upload" />
        Choose a file
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}

function FileRow({ file }: { file: StoredFile }) {
  const download = useDownloadFile();
  const deleteFile = useDeleteFile();
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await download(file.filename);
    } catch (error) {
      toastError(error instanceof Error ? error.message : `Could not download ${file.filename}.`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Icon name="file" className="shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-medium">{file.filename}</p>
        <p className="text-xs text-muted">
          {formatBytes(file.size)}, uploaded {formatDateTime(file.created_at)}
        </p>
      </div>
      <button
        type="button"
        className="btn btn-quiet btn-icon"
        onClick={() => void handleDownload()}
        disabled={downloading}
        aria-label={`Download ${file.filename}`}
        title="Download"
      >
        <Icon name="download" />
      </button>
      <ConfirmButton
        label={`Delete ${file.filename}`}
        confirmLabel="Delete file"
        busy={deleteFile.isPending}
        onConfirm={() => deleteFile.mutate(file)}
      />
    </li>
  );
}
