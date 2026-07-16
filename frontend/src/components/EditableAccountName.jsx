import { useState } from 'react';
import { api } from '../api/client';

// Click-to-edit account nickname, used at the top of the account detail page.
// Saves via api.renameAccount and reports the new value back to the caller so
// it can update the account it's already holding in state.
export function EditableAccountName({ accountNumber, nickname, onSaved, onError, disabled }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === nickname) {
      setEditing(false);
      setValue(nickname);
      return;
    }
    setSaving(true);
    try {
      await api.renameAccount(accountNumber, trimmed);
      onSaved(trimmed);
      setEditing(false);
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="editable-name">
        <h1>{nickname}</h1>
        {!disabled && <button className="link-button" onClick={() => setEditing(true)}>Edit</button>}
      </div>
    );
  }

  return (
    <div className="editable-name">
      <input
        autoFocus
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
      <button className="link-button" disabled={saving} onClick={save}>Save</button>
      <button className="link-button" disabled={saving} onClick={() => { setEditing(false); setValue(nickname); }}>Cancel</button>
    </div>
  );
}
