import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ColumnState {
  /** tableId -> ordered column keys */
  order: Record<string, string[]>;
  hidden: Record<string, string[]>;
  setOrder: (tableId: string, order: string[]) => void;
  toggleColumn: (tableId: string, key: string) => void;
  reset: (tableId: string) => void;
}

export const useColumnStore = create<ColumnState>()(
  persist(
    (set, get) => ({
      order: {},
      hidden: {},
      setOrder: (tableId, order) => set({ order: { ...get().order, [tableId]: order } }),
      toggleColumn: (tableId, key) => {
        const current = get().hidden[tableId] ?? [];
        const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
        set({ hidden: { ...get().hidden, [tableId]: next } });
      },
      reset: (tableId) => {
        const order = { ...get().order };
        const hidden = { ...get().hidden };
        delete order[tableId];
        delete hidden[tableId];
        set({ order, hidden });
      },
    }),
    { name: 'arcada.table-columns' },
  ),
);
