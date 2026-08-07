/**
 * Compute rotation so the pointer (top) lands on the center of the target slice.
 * Server supplies the segment; client only calculates the visual angle.
 */
export function targetRotationDegrees(
  segmentIndex: number,
  sliceCount: number,
  extraTurns = 5,
): number {
  const slice = 360 / sliceCount;
  const centerAngle = segmentIndex * slice + slice / 2;
  return extraTurns * 360 + (360 - centerAngle);
}
