// web/app/not-found.tsx
import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <main className={styles.main}>
      <span className={styles.script}>cut!</span>
      <h1 className={styles.heading}>404</h1>
      <p className={styles.sub}>(that frame is not in the edit)</p>
      <Link href="/" className={`${styles.cta} hoverAmber asButton`}>Back to the start →</Link>
    </main>
  )
}
