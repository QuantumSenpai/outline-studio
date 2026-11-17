import Link from 'next/link';
export function Brand() {
  return <Link href="/" className="brand" aria-label="Outline Studio home">
    <svg width="31" height="32" viewBox="0 0 31 32" fill="none" aria-hidden="true">
      <path d="M3 8V29H23V8H3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3H28V24M9 15H17M9 21H17" stroke="currentColor" strokeWidth="2" />
    </svg><span>Outline{' '}<span className="brand-light">Studio</span></span>
  </Link>;
}
