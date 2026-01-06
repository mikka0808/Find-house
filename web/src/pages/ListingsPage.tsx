import { useEffect, useMemo, useState } from "react";
import { fetchListings } from "../lib";
import { Listing } from "../types";
import { useSeenListings } from "../hooks/useSeenListings";

interface Filters {
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  minScore?: number;
  showSeen: boolean;
  sort: "date" | "score" | "pricePerSqm";
}

const defaultFilters: Filters = {
  showSeen: false,
  sort: "date"
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { seen, toggleSeen } = useSeenListings();

  useEffect(() => {
    fetchListings().then(setListings);
  }, []);

  const filtered = useMemo(() => {
    let result = [...listings];
    result = result.filter((l) => {
      if (!filters.showSeen && seen.has(l.fingerprint)) return false;
      if (filters.minPrice && (l.price ?? 0) < filters.minPrice) return false;
      if (filters.maxPrice && (l.price ?? 0) > filters.maxPrice) return false;
      if (filters.minSurface && (l.surface ?? 0) < filters.minSurface) return false;
      if (filters.maxSurface && (l.surface ?? 0) > filters.maxSurface) return false;
      if (filters.minScore && (l.score ?? 0) < filters.minScore) return false;
      return true;
    });

    result.sort((a, b) => {
      if (filters.sort === "score") return (b.score ?? 0) - (a.score ?? 0);
      if (filters.sort === "pricePerSqm") return (b.pricePerSqm ?? 0) - (a.pricePerSqm ?? 0);
      const dateA = new Date(a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
    return result;
  }, [listings, filters, seen]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : key === "showSeen" ? value === "true" : Number(value)
    }));
  };

  return (
    <div className="page">
      <h1>Listings</h1>
      <div className="filters">
        <label>
          Prix min
          <input
            type="number"
            value={filters.minPrice ?? ""}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
          />
        </label>
        <label>
          Prix max
          <input
            type="number"
            value={filters.maxPrice ?? ""}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
          />
        </label>
        <label>
          Surface min
          <input
            type="number"
            value={filters.minSurface ?? ""}
            onChange={(e) => updateFilter("minSurface", e.target.value)}
          />
        </label>
        <label>
          Surface max
          <input
            type="number"
            value={filters.maxSurface ?? ""}
            onChange={(e) => updateFilter("maxSurface", e.target.value)}
          />
        </label>
        <label>
          Score min
          <input
            type="number"
            value={filters.minScore ?? ""}
            onChange={(e) => updateFilter("minScore", e.target.value)}
          />
        </label>
        <label>
          Afficher vus
          <input
            type="checkbox"
            checked={filters.showSeen}
            onChange={(e) => setFilters((prev) => ({ ...prev, showSeen: e.target.checked }))}
          />
        </label>
        <label>
          Tri
          <select
            value={filters.sort}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as Filters["sort"] }))}
          >
            <option value="date">Date</option>
            <option value="score">Score</option>
            <option value="pricePerSqm">€/m²</option>
          </select>
        </label>
      </div>

      <div className="listings">
        {filtered.map((listing) => (
          <article key={listing.fingerprint} className={`listing ${seen.has(listing.fingerprint) ? "seen" : ""}`}>
            <header>
              <div>
                <h3>{listing.title}</h3>
                <p className="muted">
                  {listing.city || "Ville inconnue"} {listing.postalCode ? `(${listing.postalCode})` : ""}
                </p>
              </div>
              <div className="tags">
                {listing.anomaly && (
                  <span className={`badge ${listing.anomaly.type === "anomaly_low" ? "success" : "danger"}`}>
                    Anomalie {listing.anomaly.type === "anomaly_low" ? "basse" : "haute"}
                  </span>
                )}
                {listing.score !== undefined && <span className="badge">Score {listing.score}</span>}
                {listing.pricePerSqm !== undefined && (
                  <span className="badge">{listing.pricePerSqm.toLocaleString("fr-FR")}/m²</span>
                )}
              </div>
            </header>
            <p>{listing.description.slice(0, 240)}...</p>
            <div className="details">
              {listing.price && <span>{listing.price.toLocaleString("fr-FR")} €</span>}
              {listing.surface && <span>{listing.surface} m²</span>}
              <span>Source: {listing.sourceId}</span>
              <a href={listing.url} target="_blank" rel="noreferrer">
                Ouvrir
              </a>
              <button onClick={() => toggleSeen(listing.fingerprint)}>
                {seen.has(listing.fingerprint) ? "Marquer non vu" : "Marquer vu"}
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p>Aucun résultat avec ces filtres.</p>}
      </div>
    </div>
  );
}
