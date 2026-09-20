import { create } from 'zustand'

export const useExperienceStore = create((set) => ({
  activeArtifact: null,
  nearestArtifact: null,
  currentZone: 'byrsa',
  hasEntered: false,
  interpretationVisible: true,
  reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  setActiveArtifact: (artifact) => set({ activeArtifact: artifact }),
  setNearestArtifact: (artifact) => set({ nearestArtifact: artifact }),
  setCurrentZone: (zone) => set({ currentZone: zone }),
  enter: () => set({ hasEntered: true }),
  toggleInterpretation: () => set((state) => ({ interpretationVisible: !state.interpretationVisible })),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
}))
