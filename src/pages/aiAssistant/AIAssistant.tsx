import { useEffect, useRef, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { useAskAssistant } from "@/api/useAI";
import { generateId } from "@/utils/id";
import type { AIAssistantMessage } from "@/types";
import { ChatMessage } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import styles from "./AIAssistant.module.css";

export function AIAssistant() {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const askAssistant = useAskAssistant();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // Not every environment implements the smooth-scroll form of scrollTo
    // (jsdom in tests, some older embedded webviews) — fall back to the
    // plain scrollTop assignment rather than throwing.
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, askAssistant.isPending]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || askAssistant.isPending) return;

    setMessages((prev) => [
      ...prev,
      { id: generateId("msg"), role: "user", content: trimmed, createdAt: new Date().toISOString() },
    ]);
    setDraft("");

    const reply = await askAssistant.mutateAsync(trimmed);
    setMessages((prev) => [...prev, reply]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(draft);
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="AI Security Assistant"
        subtitle="Ask about a specific incident or indicator — every answer is clearly labeled and traces back to real data in this workspace."
      />

      <div className={styles.panel}>
        <div className={styles.messageList} ref={listRef}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <Icon name="wand-magic-sparkles" size="xl" />
              </span>
              <p className={styles.emptyTitle}>Ask the assistant about your environment</p>
              <p className={styles.emptyDescription}>
                Mocked assistant — no live model is connected in this build phase. Responses are
                generated from data already in this workspace.
              </p>
              <SuggestedPrompts onSelect={sendMessage} />
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {askAssistant.isPending && (
                <div className={styles.typingRow} aria-live="polite">
                  <span className={styles.typingAvatar}>
                    <Icon name="wand-magic-sparkles" size="sm" />
                  </span>
                  <span className={styles.typingBubble}>
                    <Icon name="circle-notch" size="sm" spin />
                    <span className="visually-hidden">The assistant is responding</span>
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <div className={styles.composerInput}>
            <Input
              label="Ask a question"
              hideLabel
              placeholder="Ask about an incident, indicator, or technique…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={askAssistant.isPending}
              autoComplete="off"
            />
          </div>
          <Button type="submit" iconRight="arrow-right" loading={askAssistant.isPending} disabled={!draft.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
