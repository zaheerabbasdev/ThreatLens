import { cloneElement, useId, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { cn } from "@/utils/cn";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  content: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: "top" | "bottom";
}

// Keeps the bubble at least this far from the viewport edge once shifted off
// its default centered position.
const EDGE_MARGIN = 8;

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  // Sanitized for the same reason as FormField — see the comment there.
  const generatedId = useId();
  const id = `tooltip-${generatedId.replace(/:/g, "")}`;

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  // The bubble is centered on its trigger by default, which overflows the
  // viewport whenever the trigger sits near a screen edge (e.g. an info icon
  // in a card's top-right corner). Once it's laid out, nudge it back within
  // bounds instead of letting it spill off-screen.
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!visible || !bubble) return;
    bubble.style.removeProperty("--shift");
    const rect = bubble.getBoundingClientRect();
    let shift = 0;
    if (rect.right > window.innerWidth - EDGE_MARGIN) {
      shift = window.innerWidth - EDGE_MARGIN - rect.right;
    } else if (rect.left < EDGE_MARGIN) {
      shift = EDGE_MARGIN - rect.left;
    }
    if (shift !== 0) {
      bubble.style.setProperty("--shift", `${shift}px`);
    }
  }, [visible]);

  return (
    <span className={styles.wrapper} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {cloneElement(children, { "aria-describedby": visible ? id : undefined })}
      <span
        ref={bubbleRef}
        role="tooltip"
        id={id}
        className={cn(styles.bubble, styles[side], visible && styles.visible)}
      >
        {content}
      </span>
    </span>
  );
}
