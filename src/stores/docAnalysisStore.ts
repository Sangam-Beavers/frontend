import { create } from 'zustand';

interface DocAnalysisState {
  docImage: File | null;
  setDocImage: (file: File | null) => void;
}

export const useDocAnalysisStore = create<DocAnalysisState>((set) => ({
  docImage: null,
  setDocImage: (file) => set({ docImage: file }),
}));
