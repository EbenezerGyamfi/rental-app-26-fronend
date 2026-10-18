const deletedPropertiesKey = 'rentrite-deleted-properties';
const deletedEventName = 'rentrite:property-deleted';

export function getDeletedPropertyIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(deletedPropertiesKey) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function isPropertyDeleted(id: string | number): boolean {
  return getDeletedPropertyIds().includes(String(id));
}

export function markPropertyDeleted(id: string | number): void {
  if (typeof window === 'undefined') return;
  const deletedIds = new Set(getDeletedPropertyIds());
  deletedIds.add(String(id));
  try { window.localStorage.setItem(deletedPropertiesKey, JSON.stringify([...deletedIds])); } catch { /* Keep the in-page event useful if storage is unavailable. */ }
  window.dispatchEvent(new Event(deletedEventName));
}

export function subscribeToDeletedProperties(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(deletedEventName, onChange);
  const onStorage = (event: StorageEvent) => { if (event.key === deletedPropertiesKey) onChange(); };
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(deletedEventName, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
