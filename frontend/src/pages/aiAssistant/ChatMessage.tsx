import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { AIAssistantMessage } from "@/types";
import styles from "./ChatMessage.module.css";

export function ChatMessage({ message }: { message: AIAssistantMessage }) {
  const { user } = useAuth();
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn(styles.row, isAssistant ? styles.assistantRow : styles.userRow)}>
      {isAssistant ? (
        <span className={styles.assistantAvatar} aria-hidden="true">
          <Icon name="wand-magic-sparkles" size="sm" />
        </span>
      ) : (
        <Avatar name={user?.name ?? "You"} seed={user?.avatarSeed ?? "you"} size="sm" />
      )}
      <div className={styles.bubbleColumn}>
        <div className={cn(styles.bubble, isAssistant ? styles.assistantBubble : styles.userBubble)}>
          {isAssistant && <span className={styles.aiTag}>AI-generated</span>}
          <p className={styles.text}>{message.content}</p>
        </div>
        <span className={styles.time}>{formatRelativeTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
