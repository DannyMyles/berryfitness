/**
 * Re-mounted on every navigation, so each page fades in softly instead of
 * swapping abruptly. Pure CSS (see .page-enter in globals.css) — content is
 * never hidden waiting on JavaScript, and it's disabled for reduced motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
