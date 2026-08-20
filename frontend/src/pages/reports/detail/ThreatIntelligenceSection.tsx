import { TopIndicatorsCard } from "@/components/TopIndicatorsCard";
import { TopTechniquesCard } from "@/components/TopTechniquesCard";
import { useTopIndicators, useTopTechniques } from "@/api/useDashboard";
import styles from "./ReportSection.module.css";

export function ThreatIntelligenceSection() {
  const topIndicators = useTopIndicators(8);
  const topTechniques = useTopTechniques(8);

  return (
    <div className={styles.twoCol}>
      <TopIndicatorsCard data={topIndicators.data} loading={topIndicators.isLoading} />
      <TopTechniquesCard data={topTechniques.data} loading={topTechniques.isLoading} />
    </div>
  );
}
