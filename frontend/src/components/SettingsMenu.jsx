import { useEffect, useRef, useState } from 'react';

// Reusable "Settings" dropdown (gear button + menu). Nothing fires on click
// alone - every item's onSelect is expected to open a confirmation step
// (Modal or ConfirmDangerModal) rather than acting immediately, so a stray
// click can't freeze/delete anything by itself. Pass `iconOnly` to render just
// the gear glyph (for placing in a card's top-right corner); an item with
// `disabled` + `disabledReason` shows the reason as a native tooltip on
// hover - wrapped in a <span> since disabled buttons don't reliably fire
// hover/title events themselves.
export function SettingsMenu({ label = 'Settings', items, iconOnly = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="settings-menu" ref={ref}>
      <button
        type="button"
        className={`settings-menu-trigger${iconOnly ? ' settings-menu-trigger-icon' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        title={iconOnly ? label : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {iconOnly ? '⚙' : `⚙ ${label}`}
      </button>
      {open && (
        <div className="settings-menu-list" role="menu">
          {items.map((item) => {
            const button = (
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={`settings-menu-item${item.danger ? ' settings-menu-item-danger' : ''}`}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            );
            return item.disabled && item.disabledReason ? (
              <span key={item.key} className="settings-menu-item-wrap" title={item.disabledReason}>
                {button}
              </span>
            ) : (
              <span key={item.key} className="settings-menu-item-wrap">{button}</span>
            );
          })}
        </div>
      )}
    </div>
  );
}
