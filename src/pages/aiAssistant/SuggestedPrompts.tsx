import styles from "./SuggestedPrompts.module.css";

const PROMPTS = [
  "Why is INC-1 high risk?",
  "Summarize INC-5",
  "Which MITRE techniques are associated with INC-1?",
  "What's related to 185.220.101.47?",
  "Show me unusual login activity",
];

export function SuggestedPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className={styles.root}>
      {PROMPTS.map((prompt) => (
        <button key={prompt} type="button" className={styles.chip} onClick={() => onSelect(prompt)}>
          {prompt}
        </button>
      ))}
    </div>
  );
}
