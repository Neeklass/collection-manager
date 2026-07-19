import styles from "./page.module.css";

export default function Home(): React.ReactElement {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Collection Manager</p>
          <h1>Your collection, ready to organize.</h1>
          <p>
            A local-first workspace for cataloging Pokemon cards and
            collectibles with fast entry, search, and valuation.
          </p>
        </div>
      </main>
    </div>
  );
}
