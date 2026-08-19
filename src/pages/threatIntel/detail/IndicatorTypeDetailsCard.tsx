import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { formatDate } from "@/utils/format";
import type { Indicator } from "@/types";
import styles from "./IndicatorTypeDetailsCard.module.css";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function IndicatorTypeDetailsCard({ indicator }: { indicator: Indicator }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <div className={styles.list}>
        {indicator.type === "ip" && (
          <>
            <Row label="Country" value={indicator.country ?? "Unknown"} />
            <Row label="ASN" value={indicator.asn ?? "Unknown"} />
            <Row label="ASN organization" value={indicator.asnOrg ?? "Unknown"} />
            <Row
              label="Tor exit node"
              value={
                indicator.isTor ? (
                  <span className={styles.warn}>
                    <Icon name="triangle-exclamation" size="xs" /> Yes
                  </span>
                ) : (
                  "No"
                )
              }
            />
          </>
        )}
        {indicator.type === "domain" && (
          <>
            <Row label="Registrar" value={indicator.registrar ?? "Unknown"} />
            <Row
              label="Registered"
              value={indicator.registeredAt ? formatDate(indicator.registeredAt) : "Unknown"}
            />
          </>
        )}
        {indicator.type === "url" && (
          <>
            <Row label="Domain" value={<span className="mono">{indicator.domain}</span>} />
            <Row label="Path" value={<span className="mono">{indicator.path}</span>} />
            <Row
              label="Known malware host"
              value={
                indicator.isMalwareHost ? (
                  <span className={styles.warn}>
                    <Icon name="triangle-exclamation" size="xs" /> Yes
                  </span>
                ) : (
                  "No"
                )
              }
            />
          </>
        )}
        {indicator.type === "hash" && (
          <>
            <Row label="Algorithm" value={indicator.algorithm.toUpperCase()} />
            <Row label="File name" value={indicator.fileName ?? "Unknown"} />
            <Row label="File type" value={indicator.fileType ?? "Unknown"} />
            <Row
              label="File size"
              value={indicator.fileSizeBytes ? formatBytes(indicator.fileSizeBytes) : "Unknown"}
            />
            <Row label="Malware family" value={indicator.malwareFamily ?? "Not classified"} />
          </>
        )}
      </div>
    </Card>
  );
}
