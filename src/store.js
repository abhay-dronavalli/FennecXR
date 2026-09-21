import { create } from 'zustand'

const timeOrder = ['dawn', 'day', 'dusk', 'night']

export const useExperienceStore = create((set) => ({
  activeArtifact: null,
  nearestArtifact: null,
  currentZone: 'temple',
  hasEntered: false,
  timeOfDay: 'dusk',
  reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  setActiveArtifact: (artifact) => set({ activeArtifact: artifact }),
  setNearestArtifact: (artifact) => set({ nearestArtifact: artifact }),
  setCurrentZone: (zone) => set({ currentZone: zone }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  cycleTimeOfDay: () => set((state) => {
    const currentIndex = timeOrder.indexOf(state.timeOfDay)
    return { timeOfDay: timeOrder[(currentIndex + 1) % timeOrder.length] }
  }),
  enter: () => set({ hasEntered: true }),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
  pamphletOpen: false,
  setPamphletOpen: (v) => set({ pamphletOpen: v }),
  viewpoint: null,
  setViewpoint: (viewpoint) => set({ viewpoint }),
  teleportTarget: null,
  setTeleportTarget: (pos) => set({ teleportTarget: pos }),
  savedCameraPos: null,
  setSavedCameraPos: (pos) => set({ savedCameraPos: pos }),
  hudHidden: false,
  toggleHud: () => set((state) => ({ hudHidden: !state.hudHidden })),
  ttsSpeaking: false,
  setTtsSpeaking: (v) => set({ ttsSpeaking: v }),
}))
