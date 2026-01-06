import { useEffect, useMemo, useState } from "react";
import { fetchListings, fetchSources, fetchStats, fetchStatuses } from "../lib";
import { Listing, SourceStatusMap, StatsData } from "../types";

export default function DashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [statuses, setStatuses] = useState<SourceStatusMap>({});
  const [stats, setStats] = useState<StatsData>({ perCity: {}, updatedAt: null });
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    fetchListings().then(setListings);
    fetchStatuses().then(setStatuses);
    fetchStats().then(setStats);
    fetchSources().then(setSources);
  }, []);

  const activeSources = useMemo(() => sources.filter((s) => s.enabled).length, [sources]);
  const blockedSources = useMemo(
    () => Object.values(statuses).filter((s) => s.blocked).length,
    [statuses]
  );
  const anomalies = useMemo(() => listings.filter((l) => l.anomaly), [listings]);

  return (
    <div className="page">
      <h1>Tableau de bord</h1>
      <div className="grid">
        <Card title="Annonces total" value={listings.length} />
        <Card title="Sources actives" value={activeSources} />
        <Card title="Sources bloquées" value={blockedSources} tone="danger" />
        <Card title="Anomalies €/m²" value={anomalies.length} tone="warning" />
      </div>

      <section>
        <h2>Dernières erreurs</h2>
        <div className="list">
          {Object.entries(statuses)
            .filter(([, entry]) => entry.lastError)
            .slice(0, 5)
            .map(([id, entry]) => (
              <div key={id} className="list-item error">
                <strong>{id}</strong>
                <span>{entry.lastError}</span>
              </div>
            ))}
          {Object.values(statuses).every((s) => !s.lastError) && <p>Aucune erreur récente</p>}
        </div>
      </section>

      <section>
        <h2>Statistiques €/m² (30 jours)</h2>
        {stats.updatedAt ? <p>MAJ: {new Date(stats.updatedAt).toLocaleString()}</p> : null}
        <div className="table">
          <div className="table-row header">
            <span>Ville/CP</span>
            <span>Moyenne</span>
            <span>Écart-type</span>
          </div>
          {Object.entries(stats.perCity).map(([key, entry]) => (
            <div key={key} className="table-row">
              <span>{key}</span>
              <span>{entry.mean.toLocaleString("fr-FR")}</span>
              <span>{entry.std.toLocaleString("fr-FR")}</span>
            </div>
          ))}
          {Object.keys(stats.perCity).length === 0 && <p>Aucune donnée disponible</p>}
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  value,
  tone = "default"
}: {
  title: string;
  value: number;
  tone?: "default" | "danger" | "warning";
}) {
  return (
    <div className={`card ${tone}`}>
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}
