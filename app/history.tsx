import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Dimensions, TouchableOpacity, Share, Alert, AppState, AppStateStatus,
} from 'react-native';
import { ref, onValue, query, orderByChild, limitToLast, push, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebaseConfig';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const SCREEN_W = Dimensions.get('window').width;
const CHART_H  = 180;
const CHART_W  = SCREEN_W - 48;
const PAD_L    = 44;
const PAD_B    = 20;
const INNER_W  = CHART_W - PAD_L - 8;
const INNER_H  = CHART_H - PAD_B - 8;

const NORMAL = '#00D4FF';
const DANGER = '#FF4C6A';

const getPowerColor      = (w: number) => w > 1500 ? DANGER : NORMAL;
const getVoltageColor    = (v: number) => (v < 190 || v > 250) ? DANGER : NORMAL;
const getCurrentColor    = (a: number) => a > 10 ? DANGER : NORMAL;
const getKwhColor        = (k: number) => k > 300 ? DANGER : NORMAL;
const getKwhPerHourColor = (k: number) => k > 5   ? DANGER : NORMAL;

const getChartColor = (v: number, mode: Mode) => {
  if (mode === 'Power')   return getPowerColor(v);
  if (mode === 'Voltage') return getVoltageColor(v);
  if (mode === 'Current') return getCurrentColor(v);
  return getKwhPerHourColor(v);
};

type Reading    = { id: string; kwh: number; kwhPerHour: number; power: number; voltage: number; current: number; timestamp: number };
type Filter     = 'ALL' | 'TODAY' | 'WEEK';
type Mode       = 'Power' | 'Voltage' | 'Current' | 'kWh';
type BillRecord = { id: string; month: string; units: number; bill: number; resetDate: number; startDate?: number };

const formatPK = (ts: number) =>
  new Date(ts).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });

const exportCSV = async (readings: Reading[]) => {
  const header = 'Date,Time,Power (W),Voltage (V),Current (A),Total kWh,Usage This Hour (kWh)\n';
  const rows = readings.map((r) => {
    const d = new Date(r.timestamp);
    return `${d.toLocaleDateString('en-PK',{timeZone:'Asia/Karachi'})},${d.toLocaleTimeString('en-PK',{timeZone:'Asia/Karachi'})},${r.power.toFixed(1)},${r.voltage.toFixed(1)},${r.current.toFixed(3)},${r.kwh.toFixed(4)},${(r.kwhPerHour??0).toFixed(4)}`;
  }).join('\n');
  try { await Share.share({ message: header + rows, title: 'Electricity Usage Export' }); }
  catch (e) { console.log('Export error:', e); }
};

const calcBill = (units: number, isProtected = true) => {
  const fcSurcharge  = 35.26;
  const quarterlyAdj = 27.04;
  if (units <= 0) {
    const lescoTotal = fcSurcharge + quarterlyAdj;
    return parseFloat((lescoTotal + lescoTotal * 0.18).toFixed(2));
  }
  let unitsCost = 0;
  if (isProtected) {
    if (units <= 100) unitsCost = units * 10.539;
    else              unitsCost = 100 * 10.539 + (units - 100) * 12.67;
  } else {
    if      (units <= 100) unitsCost = units * 23.59;
    else if (units <= 200) unitsCost = 100 * 23.59 + (units - 100) * 30.10;
    else if (units <= 300) unitsCost = 100 * 23.59 + 100 * 30.10 + (units - 200) * 34.26;
    else if (units <= 400) unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + (units - 300) * 39.15;
    else if (units <= 500) unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + 100 * 39.15 + (units - 400) * 41.36;
    else if (units <= 600) unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + 100 * 39.15 + 100 * 41.36 + (units - 500) * 42.78;
    else if (units <= 700) unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + 100 * 39.15 + 100 * 41.36 + 100 * 42.78 + (units - 600) * 43.92;
    else                   unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + 100 * 39.15 + 100 * 41.36 + 100 * 42.78 + 100 * 43.92 + (units - 700) * 48.84;
  }
  const fpa        = units * 0.1698;
  const lescoTotal = unitsCost + fpa + fcSurcharge + quarterlyAdj;
  const elecDuty   = lescoTotal * 0.015;
  const gst        = lescoTotal * 0.18;
  const incomeTax  = !isProtected && units > 200 ? lescoTotal * 0.075 : 0;
  return parseFloat((lescoTotal + elecDuty + gst + incomeTax).toFixed(2));
};

// ─── SVG Line Chart ─────────────────────────────────────────────
const LineChart = ({ data, mode }: { data: number[]; mode: Mode }) => {
  if (data.length < 2) return (
    <View style={{ width: CHART_W, height: CHART_H, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1A2540', borderRadius: 10, borderStyle: 'dashed' }}>
      <Text style={{ fontSize: 28, marginBottom: 8 }}>📡</Text>
      <Text style={{ color: '#AAB4C8', fontSize: 13, fontWeight: '700' }}>Awaiting Data</Text>
      <Text style={{ color: '#3A4A6B', fontSize: 11, marginTop: 4 }}>Graph will appear once the ESP32 begins transmitting readings.</Text>
    </View>
  );
  const max   = Math.max(...data) * 1.05 || 1;
  const min   = Math.min(...data) * 0.95;
  const range = max - min || 1;
  const n     = data.length;
  const color = getChartColor(data.reduce((a, b) => a + b, 0) / n, mode);
  const pts   = data.map((v, i) => ({
    x: PAD_L + (i / (n - 1)) * INNER_W,
    y: 8 + INNER_H - ((v - min) / range) * INNER_H,
    v,
  }));
  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cpx  = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');
  const areaPath = `${linePath} L ${pts[pts.length-1].x} ${CHART_H - PAD_B} L ${pts[0].x} ${CHART_H - PAD_B} Z`;
  const yLabels  = [0, 0.5, 1].map(p => ({ val: min + p * range, y: 8 + INNER_H - p * INNER_H }));
  const gradId   = `grad_${mode}`;
  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.18" />
          <Stop offset="1" stopColor={color} stopOpacity="0.00" />
        </LinearGradient>
      </Defs>
      {yLabels.map((l, i) => (
        <Line key={i} x1={PAD_L} y1={l.y} x2={CHART_W - 8} y2={l.y} stroke="#1A2540" strokeWidth="1" />
      ))}
      {yLabels.map((l, i) => (
        <SvgText key={i} x={PAD_L - 4} y={l.y + 4} fill="#3A4A6B" fontSize="9" textAnchor="end">
          {l.val >= 1000 ? `${(l.val/1000).toFixed(1)}k` : l.val.toFixed(mode === 'kWh' ? 3 : 0)}
        </SvgText>
      ))}
      <Path d={areaPath} fill={`url(#${gradId})`} />
      <Path d={linePath} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((pt, i) => (
        <Circle key={i} cx={pt.x} cy={pt.y} r={n <= 20 ? 5 : 3}
          fill={getChartColor(pt.v, mode)} stroke="#111827" strokeWidth="1.5" />
      ))}
    </Svg>
  );
};

// ─── Single Reading Card ─────────────────────────────────────────
const ReadingCard = ({ r }: { r: Reading }) => {
  const pCol = getPowerColor(r.power);
  return (
    <View style={[styles.row, { borderLeftWidth: 3, borderLeftColor: pCol }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowDate}>{formatPK(r.timestamp)}</Text>
        <Text style={styles.rowWatts}>
          <Text style={{ color: getPowerColor(r.power) }}>{r.power.toFixed(0)}W</Text>
          {'  •  '}
          <Text style={{ color: getVoltageColor(r.voltage) }}>{r.voltage.toFixed(0)}V</Text>
          {'  •  '}
          <Text style={{ color: getCurrentColor(r.current) }}>{r.current.toFixed(2)}A</Text>
        </Text>
        <Text style={styles.rowHour}>This Hour: {(r.kwhPerHour ?? 0).toFixed(4)} kWh</Text>
      </View>
      <View style={styles.kwhBox}>
        <Text style={[styles.rowKwh, { color: getKwhPerHourColor(r.kwhPerHour ?? 0) }]}>{(r.kwhPerHour ?? 0).toFixed(3)}</Text>
        <Text style={styles.rowKwhUnit}>kWh / hr</Text>
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const [readings, setReadings]       = useState<Reading[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<Filter>('ALL');
  const [mode, setMode]               = useState<Mode>('Power');
  const [billHistory, setBillHistory] = useState<BillRecord[]>([]);
  const [liveKwh, setLiveKwh]         = useState(0);
  const [uid, setUid]                 = useState<string | null>(null);

  const unsubReadings = useRef<(() => void) | null>(null);
  const unsubLiveKwh  = useRef<(() => void) | null>(null);
  const unsubBilling  = useRef<(() => void) | null>(null);
  const appState      = useRef(AppState.currentState);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
      if (!user) setLoading(false);
    });
    return () => unsub();
  }, []);

  const attachListeners = useCallback((currentUid: string) => {
    unsubReadings.current?.();
    unsubLiveKwh.current?.();
    unsubBilling.current?.();
    setLoading(true);

    const q = query(
      ref(db, `users/${currentUid}/readings_history`),
      orderByChild('timestamp'),
      limitToLast(800)
    );
    unsubReadings.current = onValue(q, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Reading[] = Object.entries(data).map(([id, val]: any) => {
          const rawTs = Number(val.timestamp ?? 0);
          const ts    = rawTs < 10000000000 ? rawTs * 1000 : rawTs;
          return { id, kwh: val.kwh ?? 0, kwhPerHour: 0, power: val.power ?? 0, voltage: val.voltage ?? 0, current: val.current ?? 0, timestamp: ts };
        });
        list.sort((a, b) => a.timestamp - b.timestamp);
        const withPerHour = list.map((r, i) => ({
          ...r, kwhPerHour: i === 0 ? r.kwh : Math.max(r.kwh - list[i - 1].kwh, 0)
        }));
        setReadings(withPerHour);
      } else {
        setReadings([]);
      }
      setLoading(false);
    }, () => setLoading(false));

    unsubLiveKwh.current = onValue(ref(db, `users/${currentUid}/readings/kwh`), (snap) => {
      if (snap.exists()) setLiveKwh(snap.val() ?? 0);
    });

    unsubBilling.current = onValue(ref(db, `users/${currentUid}/billing_history`), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: BillRecord[] = Object.entries(data).map(([id, val]: any) => ({
          id, month: val.month ?? '', units: val.units ?? 0,
          bill: val.bill ?? 0, resetDate: val.resetDate ?? 0, startDate: val.startDate ?? null,
        }));
        list.sort((a, b) => b.resetDate - a.resetDate);
        setBillHistory(list);
      } else {
        setBillHistory([]);
      }
    });
  }, []);

  useEffect(() => {
    if (!uid) return;
    attachListeners(uid);
    return () => {
      unsubReadings.current?.();
      unsubLiveKwh.current?.();
      unsubBilling.current?.();
    };
  }, [uid, attachListeners]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active' && uid) {
        attachListeners(uid);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [uid, attachListeners]);

  const filtered = readings.filter((r) => {
    if (filter === 'TODAY') {
      const displayed = formatPK(r.timestamp);
      const todayStr  = new Date().toLocaleDateString('en-PK', {
        day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Karachi'
      });
      return displayed.startsWith(todayStr);
    }
    if (filter === 'WEEK') return r.timestamp > Date.now() - 604800000;
    return true;
  });

  const reversedReadings = [...filtered].reverse();

  const chartData = filtered.map((r) =>
    mode === 'Power' ? r.power : mode === 'Voltage' ? r.voltage : mode === 'Current' ? r.current : (r.kwhPerHour ?? 0)
  );

  const modeConfig: Record<Mode, { unit: string; normalLabel: string; highLabel: string }> = {
    Power:   { unit: 'W',   normalLabel: 'Normal <1500W',   highLabel: 'High >1500W'       },
    Voltage: { unit: 'V',   normalLabel: 'Normal 190-250V', highLabel: 'Danger <190/>250V' },
    Current: { unit: 'A',   normalLabel: 'Normal <10A',     highLabel: 'High >10A'         },
    kWh:     { unit: 'kWh', normalLabel: 'Normal <5 kWh',   highLabel: 'High >5 kWh'       },
  };

  const cfg      = modeConfig[mode];

  // ✅ Fix — 0.001 ki jagah 0
  const maxVal   = chartData.length > 0 ? Math.max(...chartData) : 0;
  const avgVal   = chartData.length ? chartData.reduce((a, b) => a + b, 0) / chartData.length : 0;
  const totalKwh = filtered.reduce((s, r) => s + (r.kwhPerHour ?? 0), 0);
  const avgColor = getChartColor(avgVal, mode);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      nestedScrollEnabled={true}
    >
      <Text style={[styles.title, { color: '#FFD700' }]}>Usage History ⚡</Text>
      <Text style={styles.sub}>{filtered.length} readings</Text>

      {loading ? (
        <ActivityIndicator color={NORMAL} size="large" style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* Filter Buttons */}
          <View style={styles.filterRow}>
            {(['TODAY', 'WEEK', 'ALL'] as Filter[]).map((f) => (
              <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'TODAY' ? 'Today' : f === 'WEEK' ? 'This Week' : 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total kWh</Text>
              <Text style={[styles.statValue, { color: getKwhColor(totalKwh) }]}>{totalKwh.toFixed(3)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avg {mode}</Text>
              <Text style={[styles.statValue, { color: avgColor }]}>{avgVal.toFixed(mode === 'kWh' ? 4 : 1)} {cfg.unit}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Peak {mode}</Text>
              <Text style={[styles.statValue, { color: getChartColor(maxVal, mode) }]}>{maxVal.toFixed(mode === 'kWh' ? 4 : 1)} {cfg.unit}</Text>
            </View>
          </View>

          {/* Mode Buttons */}
          <View style={styles.modeRow}>
            {(['Power', 'Voltage', 'Current', 'kWh'] as Mode[]).map((m) => {
              const avg = filtered.length
                ? filtered.reduce((s, r) => s + (m === 'Power' ? r.power : m === 'Voltage' ? r.voltage : m === 'Current' ? r.current : (r.kwhPerHour ?? 0)), 0) / filtered.length
                : 0;
              const col = getChartColor(avg, m);
              return (
                <TouchableOpacity key={m}
                  style={[styles.modeBtn, mode === m && { backgroundColor: col + '22', borderColor: col }]}
                  onPress={() => setMode(m)}>
                  <Text style={[styles.modeBtnText, mode === m && { color: col }]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Chart */}
          <View style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: avgColor }]}>{mode} over time</Text>
            <LineChart data={chartData} mode={mode} />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: NORMAL }]} />
                <Text style={[styles.legendText, { color: NORMAL }]}>{cfg.normalLabel}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: DANGER }]} />
                <Text style={[styles.legendText, { color: DANGER }]}>{cfg.highLabel}</Text>
              </View>
            </View>
          </View>

          {/* Export */}
          <TouchableOpacity style={styles.exportBtn} onPress={() => exportCSV(filtered)}>
            <Text style={styles.exportBtnText}>📤 Export CSV</Text>
          </TouchableOpacity>

          {/* Hourly Readings */}
          <Text style={styles.listTitle}>Hourly Readings</Text>
          {filtered.length === 0 ? (
            <View style={styles.noReadings}>
              <Text style={styles.noReadingsText}>⏳ No readings available yet. Data will appear once the ESP32 starts transmitting.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.readingsBox}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {reversedReadings.map((r) => <ReadingCard key={r.id} r={r} />)}
            </ScrollView>
          )}

          {/* Billing History */}
          <View style={styles.billSection}>
            <Text style={styles.listTitle}>📅 Billing History</Text>
            {billHistory.length === 0 ? (
              <View style={styles.billEmpty}>
                <Text style={styles.billEmptyText}>No billing records found.{'\n'}Billing records will appear at the end of each month.</Text>
              </View>
            ) : (
              billHistory.map((b) => (
                <View key={b.id} style={styles.billRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billMonth}>{b.month}</Text>
                    <Text style={styles.billUnits}>{b.units.toFixed(2)} kWh consumed</Text>
                    <View style={styles.billDates}>
                      <Text style={styles.billDateLabel}>📅 Billing Period</Text>
                      <Text style={styles.billDateValue}>
                        {b.startDate ? new Date(b.startDate * 1000).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' }) : '—'}
                        {'  →  '}
                        {new Date(b.resetDate * 1000).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.billAmtBox}>
                    <Text style={styles.billAmt}>₨{b.bill.toFixed(0)}</Text>
                    <Text style={styles.billAmtLabel}>Total Bill</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const BG = '#0A0F1E', CARD = '#111827', BORDER = '#1A2540';
const styles = StyleSheet.create({
  scroll:           { backgroundColor: BG },
  container:        { padding: 20, paddingBottom: 40 },
  title:            { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 8 },
  sub:              { color: '#3A4A6B', fontSize: 14, marginBottom: 16, marginTop: 2 },
  filterRow:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn:        { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: BORDER, alignItems: 'center', backgroundColor: CARD },
  filterBtnActive:  { borderColor: NORMAL, backgroundColor: '#00D4FF22' },
  filterText:       { color: '#3A4A6B', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: NORMAL },
  statsRow:         { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox:          { flex: 1, backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 12, alignItems: 'center' },
  statLabel:        { color: '#3A4A6B', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statValue:        { fontSize: 14, fontWeight: '800' },
  modeRow:          { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeBtn:          { flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: BORDER, alignItems: 'center', backgroundColor: CARD },
  modeBtnText:      { color: '#3A4A6B', fontSize: 11, fontWeight: '700' },
  chartCard:        { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 14 },
  chartTitle:       { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  legendRow:        { flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:        { width: 8, height: 8, borderRadius: 4 },
  legendText:       { fontSize: 10, fontWeight: '600' },
  exportBtn:        { backgroundColor: '#00D4FF22', borderRadius: 12, borderWidth: 1, borderColor: '#00D4FF55', padding: 14, alignItems: 'center', marginBottom: 20 },
  exportBtnText:    { color: NORMAL, fontWeight: '700', fontSize: 14 },
  listTitle:        { color: '#AAB4C8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  readingsBox:      { maxHeight: 420, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 8 },
  row:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 8 },
  rowDate:          { color: '#3A4A6B', fontSize: 11, marginBottom: 3 },
  rowWatts:         { fontSize: 13, fontWeight: '600' },
  rowHour:          { color: '#AAB4C8', fontSize: 11, marginTop: 3 },
  kwhBox:           { alignItems: 'center' },
  rowKwh:           { fontSize: 20, fontWeight: '800' },
  rowKwhUnit:       { color: '#3A4A6B', fontSize: 10, fontWeight: '600' },
  noReadings:       { backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#1A2540', padding: 16, alignItems: 'center', marginBottom: 8 },
  noReadingsText:   { color: '#3A4A6B', fontSize: 12, textAlign: 'center', lineHeight: 20 },
  billSection:      { marginTop: 24 },
  billEmpty:        { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, alignItems: 'center' },
  billEmptyText:    { color: '#3A4A6B', fontSize: 12, textAlign: 'center', lineHeight: 20 },
  billRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 3, borderLeftColor: '#FFD700', padding: 14, marginBottom: 8 },
  billMonth:        { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  billUnits:        { color: NORMAL, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  billDates:        { marginTop: 6, backgroundColor: '#00D4FF08', borderRadius: 8, borderWidth: 1, borderColor: '#00D4FF22', padding: 8 },
  billDateLabel:    { color: '#3A4A6B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  billDateValue:    { color: '#00D4FF', fontSize: 12, fontWeight: '600' },
  billAmtBox:       { alignItems: 'flex-end' },
  billAmt:          { color: '#FFD700', fontSize: 22, fontWeight: '800' },
  billAmtLabel:     { color: '#3A4A6B', fontSize: 10, fontWeight: '600' },
});