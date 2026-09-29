import styles from './Marquee.module.css'

/** Prototype renders the word list twice; the track translates -50% for a seamless loop. */
export function Marquee({words}: {words: string[]}) {
  if (words.length === 0) return null
  const items = [...words, ...words]
  return (
    <div className={styles.band} aria-hidden="true">
      <div className={styles.track} data-motion="loop">
        {items.map((word, i) => (
          <span key={`${word}-${i}`} className={styles.item}>
            {word}
            <span className={styles.amp}>&amp;</span>
          </span>
        ))}
      </div>
    </div>
  )
}
