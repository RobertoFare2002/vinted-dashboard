
type Kpi = {
  allRevenue: number;
  allPending: number;
  allCost: number;
};

export default function CashFlowCard({ kpi }: { kpi: Kpi }) {
  const entrate = kpi.allRevenue + kpi.allPending;
  const uscite = kpi.allCost;
  const saldo = entrate - uscite;
  const recoveryRate =
    uscite > 0 ? ((entrate / uscite) * 100).toFixed(1) : "—";

  const fmt = (n: number) =>
    n.toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    });

  const isNegative = saldo < 0;

  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(0,0,0,0.1)",
        borderRadius: 12,
        padding: "20px 20px 16px",
        textAlign: "center",
      }}
    >
      {/* Label */}
      <p
        style={{
          fontSize: 11,
          color: "#888",
          letterSpacing: "0.08em",
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        Cash flow — all time
      </p>

      {/* Saldo hero */}
      <p
        style={{
          fontSize: 40,
          fontWeight: 500,
          lineHeight: 1,
          color: isNegative ? "#E24B4A" : "#1D9E75",
          marginBottom: 6,
        }}
      >
        {isNegative ? "−" : "+"}€{Math.abs(Math.round(saldo))}
      </p>

      {/* Sub */}
      <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
        saldo netto
      </p>

      {/* Recovery rate */}
      <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
        {recoveryRate}% recovery rate
      </p>

      {/* Divider */}
      <div
        style={{
          height: "0.5px",
          background: "rgba(0,0,0,0.08)",
          marginBottom: 14,
        }}
      />

      {/* In / Out row */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          alignItems: "center",
        }}
      >
        {/* Entrate */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <p style={{ fontSize: 11, color: "#888" }}>entrate</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#E1F5EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 8V2M2 5l3-3 3 3"
                  stroke="#1D9E75"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{ fontSize: 14, fontWeight: 500, color: "#1D9E75" }}
            >
              {fmt(entrate)}
            </span>
          </div>
        </div>

        {/* Vertical divider */}
        <div
          style={{
            width: "0.5px",
            height: 32,
            background: "rgba(0,0,0,0.08)",
          }}
        />

        {/* Uscite */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <p style={{ fontSize: 11, color: "#888" }}>uscite</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#FCEBEB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 2v6M2 5l3 3 3-3"
                  stroke="#E24B4A"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{ fontSize: 14, fontWeight: 500, color: "#E24B4A" }}
            >
              {fmt(uscite)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
