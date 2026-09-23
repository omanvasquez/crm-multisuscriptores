/**
 * Triggers subtle native haptic feedback on supported mobile devices
 */
export function triggerHaptic(type = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    if (type === 'heavy') {
      navigator.vibrate([40, 30, 60]);
    } else if (type === 'medium') {
      navigator.vibrate(40);
    } else {
      navigator.vibrate(25);
    }
  } catch (e) {
    // Ignore unsupported devices or permission restrictions
  }
}
