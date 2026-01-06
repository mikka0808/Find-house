import { useEffect, useState } from "react";
import { fetchSources, fetchStatuses } from "../lib";
import { SourceStatusMap } from "../types";
import type { SourceConfig } from "../lib";

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceConfig[]>([]);
  const [statuses, setStatuses] = useState<SourceStatusMap>({});

  useEffect(() => {
    fetchSources().then(setSources);
    fetchStatuses().then(setStatuses);
  }, []);

  return (
    <div className="page">
      <h1>Sources</h1>
      <div className="table">
        <div className="table-row header">
          <span>Nom</span>
          <span>Type</span>
          <span>Dernier run</span>
          <span>Statut</span>
          <span>Tags</span>
        </div>
        {sources.map((source) => {
          const status = statuses[source.id];
          const blocked = status?.blocked;
          return (
            <div key={source.id} className="table-row">
              <span>{source.name}</span>
              <span>{source.type}</span>
              <span>{status?.lastRun ? new Date(status.lastRun).toLocaleString() : "-"}</span>
              <span className={blocked ? "danger" : ""}>
                {!source.enabled ? "désactivée" : blocked ? "bloquée" : "ok"}
                {status?.lastError ? ` (${status.lastError})` : ""}
              </span>
              <span>{source.tags?.join(", ") || "-"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
