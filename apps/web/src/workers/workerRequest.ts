export async function workerRequest<T>(worker: EventTarget, run: () => Promise<T>, milliseconds = 30000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectFailure: (error: Error) => void = () => {};
  const failure = new Promise<never>((_, reject) => { rejectFailure = reject;
    timer = setTimeout(() => reject(new Error('Local rendering exceeded its 30-second limit. Reduce the document and retry.')), milliseconds);
  });
  const onError = () => rejectFailure(new Error('The local renderer could not initialize or communicate. Reload and retry; your accepted revision is preserved.'));
  worker.addEventListener('error', onError); worker.addEventListener('messageerror', onError);
  try { return await Promise.race([run(), failure]); }
  finally { clearTimeout(timer); worker.removeEventListener('error', onError); worker.removeEventListener('messageerror', onError); }
}
