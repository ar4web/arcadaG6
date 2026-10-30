import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WidgetPlacement {
  id: string;
  span: 1 | 2 | 3 | 4;
  visible: boolean;
}

interface LayoutState {
  widgets: WidgetPlacement[];
  setWidgets: (widgets: WidgetPlacement[]) => void;
  resetLayout: () => void;
}

/** Default dashboard composition — ids resolve through the widget registry. */
export const DEFAULT_WIDGETS: WidgetPlacement[] = [
  { id: 'kpi-headcount', span: 1, visible: true },
  { id: 'kpi-new-hires', span: 1, visible: true },
  { id: 'kpi-turnover', span: 1, visible: true },
  { id: 'kpi-on-leave', span: 1, visible: true },
  { id: 'chart-headcount', span: 3, visible: true },
  { id: 'chart-departments', span: 1, visible: true },
  { id: 'chart-attrition-reasons', span: 1, visible: true },
  { id: 'leave-balance', span: 1, visible: true },
  { id: 'insight-actions', span: 1, visible: true },
  { id: 'chart-attendance', span: 2, visible: true },
  { id: 'table-departments', span: 2, visible: true },
  { id: 'upcoming-leave', span: 1, visible: true },
  { id: 'list-flight-risk', span: 1, visible: true },
  { id: 'chart-payroll-cost', span: 2, visible: true },
  { id: 'chart-tenure', span: 1, visible: true },
  { id: 'chart-gender', span: 1, visible: true },
  { id: 'chart-goals', span: 2, visible: true },
  { id: 'list-activity', span: 2, visible: true },
];

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      setWidgets: (widgets) => set({ widgets }),
      resetLayout: () => set({ widgets: DEFAULT_WIDGETS }),
    }),
    { name: 'arcada.dashboard-layout' },
  ),
);
