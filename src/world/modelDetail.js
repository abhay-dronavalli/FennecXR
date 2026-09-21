// A dead band avoids repeated swaps while walking near the boundary.
export function wantsFullDetail(distance, currentlyFull) {
  return distance < (currentlyFull ? 24 : 18)
}
