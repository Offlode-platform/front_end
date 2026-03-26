import type {
  NeedsAttentionBucketsResponse,
  NeedsAttentionV2Response,
} from "@/types/dashboard";

type DashboardNeedsAttentionProps = {
  data: NeedsAttentionV2Response | null;
  buckets: NeedsAttentionBucketsResponse | null;
  error: string | undefined;
};

type AttentionBucketItem = {
  key: keyof NeedsAttentionBucketsResponse;
  label: string;
};

const BUCKETS: AttentionBucketItem[] = [
  { key: "non_responsive_clients", label: "Non-responsive clients" },
  { key: "vat_deadline_upcoming", label: "VAT deadline upcoming" },
  { key: "delivery_failures", label: "Delivery failures" },
  { key: "security_issues", label: "Security issues" },
  { key: "flagged_uploads", label: "Flagged uploads" },
  { key: "unassigned_clients", label: "Unassigned clients" },
];

export function DashboardNeedsAttention({
  data,
  buckets,
  error,
}: DashboardNeedsAttentionProps) {
  const bucketCounts = BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: buckets?.[bucket.key]?.length ?? 0,
  }));
  const totalBucketCount = bucketCounts.reduce((acc, item) => acc + item.count, 0);

  return (
    <article className="ws-card u-mb-0">
      <div className="ws-settings-row" style={{ border: "none", paddingBottom: "var(--sp-4)" }}>
        <span className="ws-card-title u-mb-0">Needs Attention</span>
        <span className="ws-settings-value u-text-muted">
          {data?.clients?.length ?? totalBucketCount}
        </span>
      </div>
      {error ? <p className="dash-kpi-sub">{error}</p> : null}
      {!error && data?.clients?.length ? (
        <div>
          {data.clients.slice(0, 6).map((client) => (
            <div className="dash-row ws-row-hover" key={client.client_id}>
              <div className="cl-avatar-sm">
                {client.client_name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="dash-row-info">
                <div className="dash-row-name">{client.client_name}</div>
                <div className="dash-row-meta">Missing docs: {client.missing_count}</div>
              </div>
              <span className="ws-item-task-count review">{client.missing_count}</span>
            </div>
          ))}
        </div>
      ) : null}
      {!error && !data?.clients?.length && totalBucketCount > 0 ? (
        <div>
          {bucketCounts
            .filter((item) => item.count > 0)
            .map((item) => (
              <div className="dash-row" key={item.label}>
                <div className="dash-row-info">
                  <div className="dash-row-name">{item.label}</div>
                  <div className="dash-row-meta">{item.count} clients</div>
                </div>
                <span className="ws-item-task-count review">{item.count}</span>
              </div>
            ))}
        </div>
      ) : null}
      {!error && !data?.clients?.length && totalBucketCount === 0 ? (
        <p className="dash-kpi-sub">All clear - nothing needs input right now.</p>
      ) : null}
    </article>
  );
}
