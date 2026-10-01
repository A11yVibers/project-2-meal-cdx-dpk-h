import { useState } from 'react'
import Icon from './Icon.jsx'

export function Card({ children, className = '', style, onClick, role, tabIndex }) {
  return (
    <div
      className={`card ${className}`}
      style={style}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
    >
      {children}
    </div>
  )
}

export function SectionCard({ title, icon, action, children, className = '' }) {
  return (
    <section className={`section-card ${className}`}>
      <div className="section-heading">
        <div className="section-title">
          {icon ? <Icon name={icon} size={19} /> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Pill({ children, tone = 'neutral', title }) {
  return (
    <span className={`pill pill-${tone}`} title={title}>
      {children}
    </span>
  )
}

export function EmptyState({ icon = 'cart', title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  )
}

export function IconButton({ label, icon, onClick, disabled = false, className = '', active = false }) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? 'is-active' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size={16} />
    </button>
  )
}

export function ConfirmButton({ onConfirm, label = 'Remove', children, className = '' }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className={`confirm-actions ${className}`} onBlur={() => setConfirming(false)}>
        <button type="button" className="button button-small button-danger" onClick={onConfirm}>
          Confirm
        </button>
        <button type="button" className="button button-small button-ghost" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button type="button" className={`button button-small button-ghost-danger ${className}`} onClick={() => setConfirming(true)}>
      {children}
    </button>
  )
}
