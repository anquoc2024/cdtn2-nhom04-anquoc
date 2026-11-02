import { Link } from 'react-router-dom'

export default function Logo({ name = 'Thủy Nail', to = '/', light = false }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5" aria-label={`${name} – trang chủ`}>
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill={light ? '#FCF1F4' : '#B6506F'} />
        <path d="M32,12 C42,12 45,24 45,36 L45,46 C45,51 40,54 32,54 C24,54 19,51 19,46 L19,36 C19,24 22,12 32,12 Z" fill={light ? '#B6506F' : '#FCF1F4'} />
        <path d="M19,30 Q32,24 45,30 L45,20 Q32,8 19,20 Z" fill="#E2C9A0" />
      </svg>
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? 'text-cream' : 'text-plum'}`}>{name}</span>
    </Link>
  )
}
