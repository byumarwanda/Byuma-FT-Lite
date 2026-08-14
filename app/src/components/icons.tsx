import type { Method } from '../types'

export const CashIcon = () => (
  <svg
    width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
  >
    <rect x="2" y="5" width="16" height="10" rx="2.5" />
    <circle cx="10" cy="10" r="2.4" />
  </svg>
)

export const MomoIcon = () => (
  <svg
    width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
  >
    <rect x="5.5" y="2.5" width="9" height="15" rx="2.2" />
    <path d="M8.6 14.8h2.8" />
  </svg>
)

export const BankIcon = () => (
  <svg
    width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M3 8l7-4 7 4M4.5 8v7M15.5 8v7M8 8v7M12 8v7M2.5 16.5h15" />
  </svg>
)

export const METHODS: { k: Method; label: string; Icon: () => React.ReactElement }[] = [
  { k: 'cash', label: 'Cash', Icon: CashIcon },
  { k: 'momo', label: 'MoMo', Icon: MomoIcon },
  { k: 'bank', label: 'Bank', Icon: BankIcon },
]

export const MLABEL: Record<Method, string> = { cash: 'Cash', momo: 'MoMo', bank: 'Bank' }

export const MICON: Record<Method, () => React.ReactElement> = {
  cash: CashIcon,
  momo: MomoIcon,
  bank: BankIcon,
}

export const WarnIcon = ({ color }: { color: string }) => (
  <svg
    width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={color}
    strokeWidth="1.6" strokeLinecap="round"
  >
    <circle cx="9" cy="9" r="7" />
    <path d="M9 5.2v4.2M9 12.2v.1" />
  </svg>
)

export const OkIcon = ({ color }: { color: string }) => (
  <svg
    width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={color}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M4 9.4l3.2 3.1L14 5.6" />
  </svg>
)

/** The small red circle used beside an inline form error. */
export const ErrorIcon = () => (
  <svg
    width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#b4553a"
    strokeWidth="1.6" strokeLinecap="round"
  >
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 4.8v3.8M8 11.1v.1" />
  </svg>
)

export const ChevronLeft = () => (
  <svg
    width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M8.5 2.5L4 7l4.5 4.5" />
  </svg>
)

export const ChevronRight = ({ size = 11, color = 'currentColor' }) => (
  <svg
    width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color}
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M5.5 2.5L10 7l-4.5 4.5" />
  </svg>
)

export const PersonIcon = () => (
  <svg
    width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round"
  >
    <circle cx="9" cy="6.4" r="2.7" />
    <path d="M3.8 14.4c.9-2.4 2.8-3.6 5.2-3.6s4.3 1.2 5.2 3.6" />
  </svg>
)

export const BarsIcon = () => (
  <svg
    width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round"
  >
    <path d="M4 12.5V8M9 12.5V4.5M14 12.5v-3" />
  </svg>
)

/** Sits in the Analytics button's place before a balance has been set. */
export const PlusSmallIcon = () => (
  <svg
    width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round"
  >
    <path d="M9 4v10M4 9h10" />
  </svg>
)

export const CrossIcon = ({ size = 10 }) => (
  <svg
    width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round"
  >
    <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
  </svg>
)

export const PlusIcon = () => (
  <svg
    width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#9497a5"
    strokeWidth="1.5" strokeLinecap="round"
  >
    <path d="M10 4.5v11M4.5 10h11" />
  </svg>
)

export const BinIcon = () => (
  <svg
    width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#9497a5"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6" />
  </svg>
)

export const TriangleIcon = () => (
  <svg
    width="26" height="26" viewBox="0 0 20 20" fill="none" stroke="#b4553a"
    strokeWidth="1.6" strokeLinecap="round"
  >
    <path d="M10 3.4L2.6 16.2h14.8z" />
    <path d="M10 8v3.4M10 13.8v.1" />
  </svg>
)
