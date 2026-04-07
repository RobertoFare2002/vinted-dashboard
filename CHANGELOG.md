# Changelog

Tutte le modifiche rilevanti al progetto Vinted Dashboard sono documentate in questo file.

---

## [Unreleased]

### 2025-04-07

#### ✨ Miglioramenti UI — Attività Recenti (mobile)
- I badge di stato "In sospeso" e "Completato" nella lista mobile ora usano lo stesso design pill della tabella desktop: sfondo colorato, bordo, punto colorato e font weight coerenti.

#### ✨ Miglioramenti UI — KPI cards mobile
- Lo scroll infinito delle card nella header mobile ora funziona in entrambe le direzioni (destra e sinistra). In precedenza era possibile scorrere solo verso destra.

#### 🐛 Fix — Tooltip articoli
- Il tooltip sul nome articolo ora appare anche nella tabella **Stock Magazzino** desktop (in precedenza era presente solo in Attività Recenti e Clearance).
- Lo stile del tooltip è stato aggiornato: da sfondo scuro a **pill bianca con bordo scuro** (`border-radius: 999px`, `border: 1.5px solid #1a1a1a`).

#### 🎨 Layout — Tabella Attività Recenti
- Ridotto il margine delle colonne fisse (Data, Profilo, Acquisto, Stato, Vendita) per lasciare più spazio alla colonna **Articolo** quando la finestra è ridotta.

---

## [1.0.0] — 2025-04-01 (baseline)

### Funzionalità presenti al lancio
- Dashboard principale con KPI cards, Cash Flow, Attività Recenti, Stock Magazzino
- Profili Vinted con avatar e auto-import via URL
- Filtro dashboard per profilo via URL params
- Chrome extension sync (`sales_v1`, `stock_v1`) verso Supabase
- Grafico ricavi mensili (SalesChartCard) con filtri periodo
- Card TopProducts, AvgTicket, ConversionRate, Clearance
- Tema Finexy: sfondo grigio chiaro, accenti lime/teal, Inter font, pill buttons
- TopNav con dropdown utente e modal impostazioni (profilo, email, password)
- Favicon e icone iOS/Android per PWA
- Deploy su Vercel con branch `main`
