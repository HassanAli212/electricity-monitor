// app/index.tsx
// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
// import { ref, onValue } from 'firebase/database';
// import { db } from '../lib/firebaseConfig';

// type Reading = {
//   power: number;
//   current: number;
//   voltage: number;
//   units: number;
//   timestamp?: number;
// };

// // LESCO Full Bill Calculation (like actual bill)
// const calculateFullBill = (kwh: number) => {
//   if (kwh <= 0) return { unitsCost: 0, fuelAdj: 0, fixedCharges: 0, meterRent: 0, gst: 0, incomeTax: 0, tvLicense: 0, total: 0 };

//   // Step 1: Units cost (slabs)
//   let unitsCost = 0;
//   if (kwh <= 100) unitsCost = kwh * 12.21;
//   else if (kwh <= 200) unitsCost = 100 * 12.21 + (kwh - 100) * 14.53;
//   else if (kwh <= 300) unitsCost = 100 * 12.21 + 100 * 14.53 + (kwh - 200) * 31.51;
//   else if (kwh <= 400) unitsCost = 100 * 12.21 + 100 * 14.53 + 100 * 31.51 + (kwh - 300) * 38.41;
//   else unitsCost = 100 * 12.21 + 100 * 14.53 + 100 * 31.51 + 100 * 38.41 + (kwh - 400) * 38.41;

//   // Step 2: Fuel Adjustment Charge
//   const fuelAdj = kwh * 3.23;

//   // Step 3: Fixed Charges (based on slab)
//   let fixedCharges = 0;
//   if (kwh <= 100) fixedCharges = 75;
//   else if (kwh <= 200) fixedCharges = 150;
//   else if (kwh <= 300) fixedCharges = 200;
//   else fixedCharges = 300;

//   // Step 4: Meter Rent
//   const meterRent = 25;

//   // Step 5: TV License
//   const tvLicense = 35;

//   // Step 6: Subtotal before tax
//   const subtotal = unitsCost + fuelAdj + fixedCharges + meterRent + tvLicense;

//   // Step 7: GST 18%
//   const gst = subtotal * 0.18;

//   // Step 8: Income Tax (if > 200 units)
//   const incomeTax = kwh > 200 ? subtotal * 0.075 : 0;

//   const total = subtotal + gst + incomeTax;

//   return { unitsCost, fuelAdj, fixedCharges, meterRent, gst, incomeTax, tvLicense, total };
// };

// const StatCard = ({ label, value, unit, color, icon }: { label: string; value: string; unit: string; color: string; icon: string }) => (
//   <View style={[styles.statCard, { borderColor: color + '55' }]}>
//     <Text style={styles.statIcon}>{icon}</Text>
//     <Text style={styles.statLabel}>{label}</Text>
//     <Text style={[styles.statValue, { color }]}>{value}</Text>
//     <Text style={styles.statUnit}>{unit}</Text>
//   </View>
// );

// export default function DashboardScreen() {
//   const [latest, setLatest] = useState<Reading | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const fetchLatest = () => {
//     const readingsRef = ref(db, 'readings');
//     onValue(readingsRef, (snap) => {
//       if (snap.exists()) {
//         const val = snap.val();
//         setLatest({
//   power: val.power ?? 0,
//   current: val.current ?? 0,
//   voltage: val.voltage ?? 0,
//   units: val.kwh ?? 0,
//   timestamp: val.timestamp ?? Date.now(),
//         });
//       } else {
//         setLatest(null);
//       }
//       setLoading(false);
//       setRefreshing(false);
//     });
//   };

//   useEffect(() => { fetchLatest(); }, []);

//   const power = latest?.power ?? 0;
//   const current = latest?.current ?? 0;
//   const voltage = latest?.voltage ?? 0;
//   const units = latest?.units ?? 0;
//   const bill = calculateFullBill(units);

//   const statusColor = power > 3000 ? '#FF4C6A' : power > 1500 ? '#FFB800' : '#00D4FF';
//   const statusLabel = power > 3000 ? 'HIGH USAGE' : power > 1500 ? 'MODERATE' : 'NORMAL';

//   return (
//     <ScrollView
//       style={styles.scroll}
//       contentContainerStyle={styles.container}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLatest(); }} tintColor="#00D4FF" />}
//     >
//       <Text style={styles.title}>Good day ⚡</Text>
//       <Text style={styles.sub}>Live electricity overview</Text>

//       {loading ? (
//         <ActivityIndicator color="#00D4FF" size="large" style={{ marginTop: 60 }} />
//       ) : (
//         <>
//           {/* Main Power Card */}
//           <View style={styles.mainCard}>
//             <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
//               <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
//             </View>
//             <Text style={[styles.powerValue, { color: statusColor }]}>{power.toLocaleString()}</Text>
//             <Text style={styles.powerUnit}>Watts (Live Power)</Text>
//           </View>

//           {/* Live Stats */}
//           <View style={styles.grid}>
//             <StatCard label="Current" value={current.toFixed(2)} unit="Amperes" color="#00D4FF" icon="⚡" />
//             <StatCard label="Voltage" value={voltage.toFixed(1)} unit="Volts" color="#A78BFA" icon="🔋" />
//           </View>

//           <View style={styles.grid}>
//             <StatCard label="Units Used" value={units.toFixed(3)} unit="kWh" color="#FFB800" icon="📊" />
//             <StatCard label="Est. Bill" value={`₨${bill.total.toFixed(0)}`} unit="All charges incl." color="#FF4C6A" icon="🧾" />
//           </View>

//           <Text style={styles.updatedText}>
//             Last updated: {latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : 'Never'}
//           </Text>

//           {/* Full Bill Breakdown */}
//           <View style={styles.billCard}>
//             <Text style={styles.billTitle}>🧾 Estimated Bill Breakdown</Text>

//             {[
//               { label: 'Units Cost', value: bill.unitsCost, color: '#AAB4C8' },
//               { label: 'Fuel Adjustment (FAC)', value: bill.fuelAdj, color: '#AAB4C8' },
//               { label: 'Fixed Charges', value: bill.fixedCharges, color: '#AAB4C8' },
//               { label: 'Meter Rent', value: bill.meterRent, color: '#AAB4C8' },
//               { label: 'TV License', value: bill.tvLicense, color: '#AAB4C8' },
//               { label: 'GST (18%)', value: bill.gst, color: '#FFB800' },
//               { label: 'Income Tax', value: bill.incomeTax, color: '#FFB800' },
//             ].map((item, i) => (
//               <View key={i} style={styles.billRow}>
//                 <Text style={[styles.billLabel, { color: item.color }]}>{item.label}</Text>
//                 <Text style={[styles.billValue, { color: item.color }]}>₨{item.value.toFixed(2)}</Text>
//               </View>
//             ))}

//             <View style={styles.billTotalRow}>
//               <Text style={styles.billTotalLabel}>TOTAL PAYABLE</Text>
//               <Text style={styles.billTotalValue}>₨{bill.total.toFixed(2)}</Text>
//             </View>
//           </View>

//           {/* Tariff Slabs */}
//           <View style={styles.tariffCard}>
//             <Text style={styles.tariffTitle}>📋 LESCO Tariff Slabs</Text>
//             {[
//               { slab: '0 – 100 kWh', rate: '₨12.21 / unit' },
//               { slab: '101 – 200 kWh', rate: '₨14.53 / unit' },
//               { slab: '201 – 300 kWh', rate: '₨31.51 / unit' },
//               { slab: '301 – 400 kWh', rate: '₨38.41 / unit' },
//               { slab: '400+ kWh', rate: '₨38.41 / unit' },
//             ].map((t, i) => (
//               <View key={i} style={styles.tariffRow}>
//                 <Text style={styles.tariffSlab}>{t.slab}</Text>
//                 <Text style={styles.tariffRate}>{t.rate}</Text>
//               </View>
//             ))}
//           </View>

//           <View style={styles.tipCard}>
//             <Text style={styles.tipTitle}>💡 Tip</Text>
//             <Text style={styles.tipText}>Running appliances during off-peak hours (9 PM – 7 AM) can reduce your bill by up to 30%.</Text>
//           </View>
//         </>
//       )}
//     </ScrollView>
//   );
// }

// const BG = '#0A0F1E', CARD = '#111827', BORDER = '#1A2540';
// const styles = StyleSheet.create({
//   scroll: { backgroundColor: BG },
//   container: { padding: 20, paddingBottom: 40 },
//   title: { color: '#FFD700', fontSize: 26, fontWeight: '800', marginTop: 8 },
//   sub: { color: '#AAB4C8', fontSize: 14, marginBottom: 24, marginTop: 2 },
//   mainCard: { backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 36, marginBottom: 14, alignItems: 'center' },
//   statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 16 },
//   statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
//   powerValue: { fontSize: 72, fontWeight: '900', letterSpacing: -2 },
//   powerUnit: { color: '#3A4A6B', fontSize: 13, marginTop: 4 },
//   grid: { flexDirection: 'row', gap: 14, marginBottom: 14 },
//   statCard: { flex: 1, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, padding: 18, alignItems: 'center' },
//   statIcon: { fontSize: 22, marginBottom: 6 },
//   statLabel: { color: '#3A4A6B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
//   statValue: { fontSize: 24, fontWeight: '800' },
//   statUnit: { color: '#3A4A6B', fontSize: 10, marginTop: 4 },
//   updatedText: { color: '#3A4A6B', fontSize: 12, textAlign: 'center', marginBottom: 14, marginTop: 4 },

//   billCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: '#FF4C6A33', padding: 18, marginBottom: 14 },
//   billTitle: { color: '#FF4C6A', fontWeight: '700', fontSize: 14, marginBottom: 12 },
//   billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
//   billLabel: { fontSize: 13 },
//   billValue: { fontSize: 13, fontWeight: '600' },
//   billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
//   billTotalLabel: { color: '#FFD700', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
//   billTotalValue: { color: '#FFD700', fontSize: 18, fontWeight: '900' },

//   tariffCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18, marginBottom: 14 },
//   tariffTitle: { color: '#AAB4C8', fontWeight: '700', fontSize: 14, marginBottom: 12 },
//   tariffRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: BORDER },
//   tariffSlab: { color: '#AAB4C8', fontSize: 13 },
//   tariffRate: { color: '#FFD700', fontSize: 13, fontWeight: '700' },
//   tipCard: { backgroundColor: '#FFB8000A', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#FFB800', marginTop: 4 },
//   tipTitle: { color: '#FFB800', fontWeight: '700', fontSize: 14, marginBottom: 6 },
//   tipText: { color: '#AAB4C8', fontSize: 13, lineHeight: 20 },
// });
// app/index.tsx
// app/index.tsx
// app/index.tsx
// app/index.tsx
// app/index.tsx
// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, Platform,
//   ActivityIndicator, RefreshControl, Animated, Pressable, Alert,
//   AppState, AppStateStatus,
// } from 'react-native';
// import { ref, onValue, update, push, set, get } from 'firebase/database';
// import { signOut, onAuthStateChanged } from 'firebase/auth';
// import { db, auth } from '../lib/firebaseConfig';
// import { router } from 'expo-router';

// const NORMAL = '#00D4FF';
// const DANGER = '#FF4C6A';

// const getPowerColor   = (w: number) => w > 1500 ? DANGER : NORMAL;
// const getVoltageColor = (v: number) => (v < 190 || v > 250) ? DANGER : NORMAL;
// const getCurrentColor = (a: number) => a > 10 ? DANGER : NORMAL;
// const getKwhColor     = (k: number) => k > 300 ? DANGER : NORMAL;
// const getBillColor    = (_b: number, kwh: number) => kwh > 300 ? DANGER : NORMAL;
// const getPowerLabel   = (w: number) => w > 1500 ? 'HIGH USAGE' : 'NORMAL';
// const getVoltageLabel = (v: number) => (v < 190 || v > 250) ? 'DANGER' : 'STABLE';
// const getCurrentLabel = (a: number) => a > 10 ? 'HIGH' : 'NORMAL';

// let Notifications: any = null;
// let Device: any = null;
// if (Platform.OS !== 'web') {
//   Notifications = require('expo-notifications');
//   Device        = require('expo-device');
//   Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//       shouldShowAlert: true, shouldPlaySound: true,
//       shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true,
//     }),
//   });
// }

// async function setupNotifications() {
//   if (Platform.OS === 'web' || !Notifications || !Device?.isDevice) return;
//   const { status } = await Notifications.requestPermissionsAsync();
//   if (status !== 'granted') console.log('Notification permission denied');
// }

// async function sendAlert(title: string, body: string) {
//   if (Platform.OS === 'web' || !Notifications) return;
//   await Notifications.scheduleNotificationAsync({
//     content: { title, body, sound: true, color: DANGER },
//     trigger: null,
//   });
// }

// const AnimatedNumber = ({ value, color, fontSize, decimals = 0, prefix = '' }: {
//   value: number; color: string; fontSize: number; decimals?: number; prefix?: string;
// }) => {
//   const anim    = useRef(new Animated.Value(0)).current;
//   const [display, setDisplay] = useState(prefix + (0).toFixed(decimals));
//   const prevRef = useRef(0);
//   useEffect(() => {
//     const from = prevRef.current;
//     prevRef.current = value;
//     anim.setValue(from);
//     const id = anim.addListener(({ value: v }) => setDisplay(prefix + v.toFixed(decimals)));
//     Animated.timing(anim, { toValue: value, duration: 900, useNativeDriver: false }).start(() => {
//       anim.removeListener(id);
//       setDisplay(prefix + value.toFixed(decimals));
//     });
//     return () => anim.removeListener(id);
//   }, [value]);
//   return <Text style={{ color, fontSize, fontWeight: '900', letterSpacing: -0.5 }}>{display}</Text>;
// };

// const calculateFullBill = (kwh: number) => {
//   const fixedCharges = kwh <= 100 ? 75 : kwh <= 200 ? 150 : kwh <= 300 ? 200 : 300;
//   const meterRent = 25, tvLicense = 35;
//   if (kwh <= 0) {
//     const subtotal = fixedCharges + meterRent + tvLicense;
//     const gst = subtotal * 0.18;
//     return { unitsCost: 0, fuelAdj: 0, fixedCharges, meterRent, gst, incomeTax: 0, tvLicense, total: parseFloat((subtotal + gst).toFixed(2)) };
//   }
//   let unitsCost = 0;
//   if (kwh <= 100)      unitsCost = kwh * 12.21;
//   else if (kwh <= 200) unitsCost = 100 * 12.21 + (kwh - 100) * 14.53;
//   else if (kwh <= 300) unitsCost = 100 * 12.21 + 100 * 14.53 + (kwh - 200) * 31.51;
//   else if (kwh <= 400) unitsCost = 100 * 12.21 + 100 * 14.53 + 100 * 31.51 + (kwh - 300) * 38.41;
//   else                 unitsCost = 100 * 12.21 + 100 * 14.53 + 100 * 31.51 + 100 * 38.41 + (kwh - 400) * 38.41;
//   const fuelAdj   = kwh * 3.23;
//   const subtotal  = unitsCost + fuelAdj + fixedCharges + meterRent + tvLicense;
//   const gst       = subtotal * 0.18;
//   const incomeTax = kwh > 200 ? subtotal * 0.075 : 0;
//   return { unitsCost, fuelAdj, fixedCharges, meterRent, gst, incomeTax, tvLicense, total: parseFloat((subtotal + gst + incomeTax).toFixed(2)) };
// };

// type AlertRule = { id: string; label: string; limitKwh: number; enabled: boolean; triggered: boolean };
// const notifiedRules = new Map<string, number>();

// const StatCard = ({ label, value, decimals, unit, color, icon, prefix, statusLabel }: {
//   label: string; value: number; decimals: number; unit: string;
//   color: string; icon: string; prefix?: string; statusLabel?: string;
// }) => (
//   <View style={[styles.statCard, { borderColor: color + '66', borderTopWidth: 3, borderTopColor: color }]}>
//     <Text style={styles.statIcon}>{icon}</Text>
//     <Text style={styles.statLabel}>{label}</Text>
//     <AnimatedNumber value={value} color={color} fontSize={24} decimals={decimals} prefix={prefix} />
//     <Text style={styles.statUnit}>{unit}</Text>
//     {statusLabel && (
//       <View style={[styles.statBadge, { backgroundColor: color + '22' }]}>
//         <Text style={[styles.statBadgeText, { color }]}>{statusLabel}</Text>
//       </View>
//     )}
//   </View>
// );

// export default function DashboardScreen() {
//   const [uid,        setUid]        = useState<string | null>(null);
//   const [power,      setPower]      = useState(0);
//   const [current,    setCurrent]    = useState(0);
//   const [voltage,    setVoltage]    = useState(0);
//   const [units,      setUnits]      = useState(0);
//   const [timestamp,  setTimestamp]  = useState<number | null>(null);
//   const [loading,    setLoading]    = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const alertRulesRef = useRef<AlertRule[]>([]);
//   const unsubReadings = useRef<(() => void) | null>(null);
//   const unsubAlerts   = useRef<(() => void) | null>(null);
//   const appState      = useRef(AppState.currentState);
//   const uidRef        = useRef<string | null>(null);

//   useEffect(() => { setupNotifications(); }, []);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setUid(user.uid);
//         uidRef.current = user.uid;
//       } else {
//         setUid(null);
//         uidRef.current = null;
//         setLoading(false);
//         router.replace('/login' as any);
//       }
//     });
//     return () => unsub();
//   }, []);

//   const checkAlerts = async (kwh: number, userId: string) => {
//     const now = Date.now();
//     for (const rule of alertRulesRef.current) {
//       if (!rule.enabled) continue;
//       if (kwh >= rule.limitKwh) {
//         const lastNotified = notifiedRules.get(rule.id) ?? 0;
//         if (now - lastNotified >= 60000) {
//           notifiedRules.set(rule.id, now);
//           await sendAlert(`⚡ Alert: ${rule.label}`, `Usage of ${kwh.toFixed(3)} kWh exceeded ${rule.limitKwh} kWh.`);
//           await update(ref(db, `users/${userId}/alerts/${rule.id}`), { triggered: true });
//           await push(ref(db, `users/${userId}/alert_history`), { ruleId: rule.id, label: rule.label, limitKwh: rule.limitKwh, kwhAtTrigger: kwh, timestamp: now });
//         }
//       } else {
//         notifiedRules.delete(rule.id);
//         await update(ref(db, `users/${userId}/alerts/${rule.id}`), { triggered: false });
//       }
//     }
//   };

//   const attachListeners = useCallback((currentUid: string) => {
//     unsubReadings.current?.();
//     unsubAlerts.current?.();

//     unsubAlerts.current = onValue(ref(db, `users/${currentUid}/alerts`), (snap) => {
//       alertRulesRef.current = snap.exists()
//         ? Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }))
//         : [];
//     });

//     const timeout = setTimeout(() => {
//       setLoading(false);
//       setRefreshing(false);
//     }, 8000);

//     unsubReadings.current = onValue(
//       ref(db, `users/${currentUid}/readings`),
//       async (snap) => {
//         clearTimeout(timeout);
//         if (snap.exists()) {
//           const val = snap.val();
//           setPower(  parseFloat(val.power   ?? 0));
//           setCurrent(parseFloat(val.current ?? 0));
//           setVoltage(parseFloat(val.voltage ?? 0));
//           setUnits(  parseFloat(val.kwh     ?? 0));
//           const rawTs = Number(val.timestamp ?? 0);
//           setTimestamp(rawTs > 0 ? (rawTs < 10000000000 ? rawTs * 1000 : rawTs) : null);
//           await checkAlerts(parseFloat(val.kwh ?? 0), currentUid);
//         }
//         setLoading(false);
//         setRefreshing(false);
//       },
//       (error) => {
//         console.log('DB error:', error.message);
//         clearTimeout(timeout);
//         setLoading(false);
//         setRefreshing(false);
//       }
//     );
//   }, []);

//   useEffect(() => {
//     if (!uid) return;
//     attachListeners(uid);
//     return () => {
//       unsubReadings.current?.();
//       unsubAlerts.current?.();
//     };
//   }, [uid, attachListeners]);

//   useEffect(() => {
//     if (refreshing && uid) attachListeners(uid);
//   }, [refreshing, uid, attachListeners]);

//   useEffect(() => {
//     const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
//       if (appState.current.match(/inactive|background/) && nextState === 'active') {
//         const currentUid = uidRef.current;
//         if (currentUid) attachListeners(currentUid);
//       }
//       appState.current = nextState;
//     });
//     return () => subscription.remove();
//   }, [attachListeners]);

//   const handleLogout = () => {
//     if (Platform.OS === 'web') {
//       if (window.confirm('Are you sure you want to log out?')) {
//         unsubReadings.current?.();
//         unsubAlerts.current?.();
//         signOut(auth).catch((e) => console.log('Logout error:', e));
//       }
//     } else {
//       Alert.alert(
//         'Log Out',
//         'Are you sure you want to log out?',
//         [
//           { text: 'Cancel', style: 'cancel' },
//           {
//             text: 'Log Out',
//             style: 'destructive',
//             onPress: () => {
//               unsubReadings.current?.();
//               unsubAlerts.current?.();
//               signOut(auth).catch((e) => console.log('Logout error:', e));
//             },
//           },
//         ],
//         { cancelable: true }
//       );
//     }
//   };

//   const handleMonthReset = () => {
//     if (!uid) return;
//     const bill  = calculateFullBill(units);
//     const now   = new Date();
//     const month = now.toLocaleString('en-PK', { month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' });
//     const endTs = Math.floor(Date.now() / 1000);

//     const doReset = async () => {
//       try {
//         const startSnap = await get(ref(db, `users/${uid}/readings/cycleStartDate`));
//         const startTs   = startSnap.exists() ? startSnap.val() : endTs;
//         await push(ref(db, `users/${uid}/billing_history`), {
//           month,
//           units:     parseFloat(units.toFixed(4)),
//           bill:      parseFloat(bill.total.toFixed(2)),
//           startDate: startTs,
//           endDate:   endTs,
//           resetDate: endTs,
//         });
//         await set(ref(db, `users/${uid}/readings/kwh`), 0);
//         await set(ref(db, `users/${uid}/readings/cycleStartDate`), endTs);

//         if (Platform.OS === 'web') {
//           window.alert(`✅ Billing record for ${month} saved!\nNew cycle started from today.`);
//         } else {
//           Alert.alert('✅ Success', `Billing record for ${month} saved!\nNew cycle started from today.`);
//         }
//       } catch (e) {
//         if (Platform.OS === 'web') {
//           window.alert('❌ Failed to save. Please try again.');
//         } else {
//           Alert.alert('❌ Error', 'Failed to save. Please try again.');
//         }
//       }
//     };

//     if (Platform.OS === 'web') {
//       if (window.confirm(
//         `🔄 Reset Billing Cycle?\n\nMonth: ${month}\nUnits: ${units.toFixed(2)} kWh\nBill: ₨${bill.total.toFixed(0)}\n\nThis will save the record and reset kWh to zero.`
//       )) {
//         doReset();
//       }
//     } else {
//       Alert.alert(
//         '🔄 Reset Billing Cycle',
//         `Month: ${month}\nUnits: ${units.toFixed(2)} kWh\nBill: ₨${bill.total.toFixed(0)}\n\nThis will save the record and reset kWh to zero.`,
//         [
//           { text: 'Cancel', style: 'cancel' },
//           { text: 'Confirm Reset', style: 'destructive', onPress: doReset },
//         ],
//         { cancelable: true }
//       );
//     }
//   };

//   const bill = calculateFullBill(units);

//   return (
//     <ScrollView
//       style={styles.scroll}
//       contentContainerStyle={styles.container}
//       keyboardShouldPersistTaps="handled"
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={NORMAL} />
//       }
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.title}>Good Day ⚡</Text>
//           <Text style={styles.sub}>Live Electricity Overview</Text>
//         </View>
//         <Pressable
//           style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.6 : 1 }]}
//           onPress={handleLogout}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Text style={styles.logoutText}>Log Out</Text>
//         </Pressable>
//       </View>

//       {loading ? (
//         <View style={{ alignItems: 'center', marginTop: 80 }}>
//           <ActivityIndicator color={NORMAL} size="large" />
//           <Text style={{ color: '#3A4A6B', marginTop: 16, fontSize: 13 }}>Connecting to Firebase...</Text>
//         </View>
//       ) : (
//         <>
//           {/* Main Power Card */}
//           <View style={[styles.mainCard, { borderColor: getPowerColor(power) + '44' }]}>
//             <View style={[styles.statusBadge, { backgroundColor: getPowerColor(power) + '22', borderColor: getPowerColor(power) }]}>
//               <Text style={[styles.statusText, { color: getPowerColor(power) }]}>{getPowerLabel(power)}</Text>
//             </View>
//             <AnimatedNumber value={power} color={getPowerColor(power)} fontSize={72} decimals={0} />
//             <Text style={styles.powerUnit}>Watts (Live Power)</Text>
//             <View style={styles.powerLegend}>
//               <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: NORMAL }]} /><Text style={styles.legendText}>Normal &lt;1500W</Text></View>
//               <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: DANGER }]} /><Text style={styles.legendText}>High &gt;1500W</Text></View>
//             </View>
//           </View>

//           <View style={styles.grid}>
//             <StatCard label="Current" value={current} decimals={2} unit="Amperes" color={getCurrentColor(current)} icon="⚡" statusLabel={getCurrentLabel(current)} />
//             <StatCard label="Voltage" value={voltage} decimals={1} unit="Volts"   color={getVoltageColor(voltage)} icon="🔋" statusLabel={getVoltageLabel(voltage)} />
//           </View>
//           <View style={styles.grid}>
//             <StatCard label="Units Used" value={units}      decimals={3} unit="kWh"               color={getKwhColor(units)}             icon="📊" />
//             <StatCard label="Est. Bill"  value={bill.total} decimals={0} unit="All charges incl." color={getBillColor(bill.total, units)} icon="🧾" prefix="₨" />
//           </View>

//           <Text style={styles.updatedText}>
//             Last Updated: {timestamp
//               ? new Date(timestamp).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
//               : 'Waiting for ESP32...'}
//           </Text>

//           <Pressable
//             style={({ pressed }) => [styles.resetMonthBtn, { opacity: pressed ? 0.7 : 1 }]}
//             onPress={handleMonthReset}
//             hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
//           >
//             <Text style={styles.resetMonthIcon}>🔄</Text>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.resetMonthTitle}>Reset Monthly Units</Text>
//               <Text style={styles.resetMonthSub}>Save this month's bill and start a new billing cycle</Text>
//             </View>
//             <Text style={{ color: DANGER, fontSize: 18 }}>›</Text>
//           </Pressable>

//           {/* Bill Breakdown */}
//           <View style={styles.billCard}>
//             <Text style={[styles.billTitle, { color: '#FFD700' }]}>🧾 Estimated Bill Breakdown</Text>
//             {[
//               { label: 'Units Cost',            value: bill.unitsCost    },
//               { label: 'Fuel Adjustment (FAC)', value: bill.fuelAdj      },
//               { label: 'Fixed Charges',         value: bill.fixedCharges },
//               { label: 'Meter Rent',            value: bill.meterRent    },
//               { label: 'TV License',            value: bill.tvLicense    },
//               { label: 'GST (18%)',             value: bill.gst          },
//               { label: 'Income Tax',            value: bill.incomeTax    },
//             ].map((item, i) => (
//               <View key={i} style={styles.billRow}>
//                 <Text style={styles.billLabel}>{item.label}</Text>
//                 <Text style={styles.billValue}>₨{item.value.toFixed(2)}</Text>
//               </View>
//             ))}
//             <View style={styles.billTotalRow}>
//               <Text style={styles.billTotalLabel}>TOTAL PAYABLE</Text>
//               <Text style={styles.billTotalValue}>₨{bill.total.toFixed(2)}</Text>
//             </View>
//           </View>

//           {/* Tariff */}
//           <View style={styles.tariffCard}>
//             <Text style={styles.tariffTitle}>📋 LESCO Tariff Slabs</Text>
//             {[
//               { slab: '0 – 100 kWh',   rate: '₨12.21 / unit' },
//               { slab: '101 – 200 kWh', rate: '₨14.53 / unit' },
//               { slab: '201 – 300 kWh', rate: '₨31.51 / unit' },
//               { slab: '301 – 400 kWh', rate: '₨38.41 / unit' },
//               { slab: '400+ kWh',      rate: '₨38.41 / unit' },
//             ].map((t, i) => (
//               <View key={i} style={styles.tariffRow}>
//                 <Text style={styles.tariffSlab}>{t.slab}</Text>
//                 <Text style={styles.tariffRate}>{t.rate}</Text>
//               </View>
//             ))}
//           </View>

//           {/* Tip */}
//           <View style={styles.tipCard}>
//             <Text style={styles.tipTitle}>💡 Energy Saving Tip</Text>
//             <Text style={styles.tipText}>Running appliances during off-peak hours (9 PM – 7 AM) can reduce your electricity bill by up to 30%.</Text>
//           </View>
//         </>
//       )}
//     </ScrollView>
//   );
// }

// const BG = '#0A0F1E', CARD = '#111827', BORDER = '#1A2540';
// const styles = StyleSheet.create({
//   scroll:          { backgroundColor: BG },
//   container:       { padding: 20, paddingBottom: 40 },
//   header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 8 },
//   title:           { color: '#FFD700', fontSize: 26, fontWeight: '800' },
//   sub:             { color: '#AAB4C8', fontSize: 14, marginTop: 2 },
//   logoutBtn:       { backgroundColor: '#FF4C6A22', borderRadius: 10, borderWidth: 1, borderColor: '#FF4C6A55', paddingHorizontal: 14, paddingVertical: 8 },
//   logoutText:      { color: DANGER, fontWeight: '700', fontSize: 13 },
//   mainCard:        { backgroundColor: CARD, borderRadius: 20, borderWidth: 1, padding: 36, marginBottom: 14, alignItems: 'center' },
//   statusBadge:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 16 },
//   statusText:      { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
//   powerUnit:       { color: '#3A4A6B', fontSize: 13, marginTop: 8 },
//   powerLegend:     { flexDirection: 'row', gap: 16, marginTop: 16 },
//   legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
//   legendDot:       { width: 8, height: 8, borderRadius: 4 },
//   legendText:      { color: '#AAB4C8', fontSize: 11 },
//   grid:            { flexDirection: 'row', gap: 14, marginBottom: 14 },
//   statCard:        { flex: 1, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, alignItems: 'center' },
//   statIcon:        { fontSize: 22, marginBottom: 6 },
//   statLabel:       { color: '#3A4A6B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
//   statUnit:        { color: '#3A4A6B', fontSize: 10, marginTop: 4 },
//   statBadge:       { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
//   statBadgeText:   { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
//   updatedText:     { color: '#3A4A6B', fontSize: 12, textAlign: 'center', marginBottom: 14, marginTop: 4 },
//   resetMonthBtn:   { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FF4C6A18', borderRadius: 16, borderWidth: 1.5, borderColor: '#FF4C6A66', padding: 18, marginBottom: 14 },
//   resetMonthIcon:  { fontSize: 28 },
//   resetMonthTitle: { color: '#FF4C6A', fontSize: 15, fontWeight: '800' },
//   resetMonthSub:   { color: '#AAB4C8', fontSize: 11, marginTop: 3 },
//   billCard:        { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: '#FF4C6A33', padding: 18, marginBottom: 14 },
//   billTitle:       { color: DANGER, fontWeight: '700', fontSize: 14, marginBottom: 12 },
//   billRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
//   billLabel:       { color: '#AAB4C8', fontSize: 13 },
//   billValue:       { color: '#AAB4C8', fontSize: 13, fontWeight: '600' },
//   billTotalRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
//   billTotalLabel:  { color: '#FFD700', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
//   billTotalValue:  { color: '#FFD700', fontSize: 18, fontWeight: '900' },
//   tariffCard:      { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18, marginBottom: 14 },
//   tariffTitle:     { color: '#AAB4C8', fontWeight: '700', fontSize: 14, marginBottom: 12 },
//   tariffRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: BORDER },
//   tariffSlab:      { color: '#AAB4C8', fontSize: 13 },
//   tariffRate:      { color: '#FFD700', fontSize: 13, fontWeight: '700' },
//   tipCard:         { backgroundColor: '#FFB8000A', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#FFB800', marginTop: 4 },
//   tipTitle:        { color: '#FFB800', fontWeight: '700', fontSize: 14, marginBottom: 6 },
//   tipText:         { color: '#AAB4C8', fontSize: 13, lineHeight: 20 },
// });
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform,
  ActivityIndicator, RefreshControl, Animated, Pressable, Alert,
  AppState, AppStateStatus, Switch,
} from 'react-native';
import { ref, onValue, update, push, set, get } from 'firebase/database';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebaseConfig';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NORMAL = '#00D4FF';
const DANGER = '#FF4C6A';
const GOLD   = '#FFD700';

const getPowerColor   = (w: number) => w > 1500 ? DANGER : NORMAL;
const getVoltageColor = (v: number) => (v < 190 || v > 250) ? DANGER : NORMAL;
const getCurrentColor = (a: number) => a > 10 ? DANGER : NORMAL;
const getKwhColor     = (k: number) => k > 300 ? DANGER : NORMAL;
const getBillColor    = (_b: number, kwh: number) => kwh > 300 ? DANGER : NORMAL;
const getPowerLabel   = (w: number) => w > 1500 ? 'HIGH USAGE' : 'NORMAL';
const getVoltageLabel = (v: number) => (v < 190 || v > 250) ? 'DANGER' : 'STABLE';
const getCurrentLabel = (a: number) => a > 10 ? 'HIGH' : 'NORMAL';

let Notifications: any = null;
let Device: any = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device        = require('expo-device');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, shouldPlaySound: true,
      shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true,
    }),
  });
}

async function setupNotifications() {
  if (Platform.OS === 'web' || !Notifications || !Device?.isDevice) return;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') console.log('Notification permission denied');
}

async function sendAlert(title: string, body: string) {
  if (Platform.OS === 'web' || !Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, color: DANGER },
    trigger: null,
  });
}

const AnimatedNumber = ({ value, color, fontSize, decimals = 0, prefix = '' }: {
  value: number; color: string; fontSize: number; decimals?: number; prefix?: string;
}) => {
  const anim    = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(prefix + (0).toFixed(decimals));
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = value;
    anim.setValue(from);
    const id = anim.addListener(({ value: v }) => setDisplay(prefix + v.toFixed(decimals)));
    Animated.timing(anim, { toValue: value, duration: 900, useNativeDriver: false }).start(() => {
      anim.removeListener(id);
      setDisplay(prefix + value.toFixed(decimals));
    });
    return () => anim.removeListener(id);
  }, [value]);
  return <Text style={{ color, fontSize, fontWeight: '900', letterSpacing: -0.5 }}>{display}</Text>;
};

// ── Bill Calculation — LESCO Tariff ──
const calculateFullBill = (kwh: number, isProtected: boolean) => {
  const fcSurcharge  = 35.26;
  const quarterlyAdj = 27.04;

  if (kwh <= 0) {
    const lescoTotal = fcSurcharge + quarterlyAdj;
    const gst        = lescoTotal * 0.18;
    return {
      unitsCost: 0, fpa: 0, electricityDuty: 0,
      fcSurcharge, quarterlyAdj, gst, incomeTax: 0,
      total: parseFloat((lescoTotal + gst).toFixed(2))
    };
  }

  let unitsCost = 0;

  if (isProtected) {
    if (kwh <= 100) unitsCost = kwh * 10.539;
    else            unitsCost = 100 * 10.539 + (kwh - 100) * 12.67;
  } else {
    if      (kwh <= 100) unitsCost = kwh * 23.59;
    else if (kwh <= 200) unitsCost = 100 * 23.59 + (kwh - 100) * 30.10;
    else if (kwh <= 300) unitsCost = 100 * 23.59 + 100 * 30.10 + (kwh - 200) * 34.26;
    else if (kwh <= 400) unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + (kwh - 300) * 39.15;
    else if (kwh <= 500) unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + 100 * 39.15 + (kwh - 400) * 41.36;
    else if (kwh <= 600) unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + 100 * 39.15 + 100 * 41.36 + (kwh - 500) * 42.78;
    else if (kwh <= 700) unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + 100 * 39.15 + 100 * 41.36 + 100 * 42.78 + (kwh - 600) * 43.92;
    else                 unitsCost = 100 * 23.59 + 100 * 30.10 + 100 * 34.26 + 100 * 39.15 + 100 * 41.36 + 100 * 42.78 + 100 * 43.92 + (kwh - 700) * 48.84;
  }

  const fpa             = kwh * 0.1698;
  const lescoTotal      = unitsCost + fpa + fcSurcharge + quarterlyAdj;
  const electricityDuty = lescoTotal * 0.015;
  const gst             = lescoTotal * 0.18;
  const incomeTax       = !isProtected && kwh > 200 ? lescoTotal * 0.075 : 0;
  const total           = lescoTotal + electricityDuty + gst + incomeTax;

  return {
    unitsCost, fpa, electricityDuty,
    fcSurcharge, quarterlyAdj, gst, incomeTax,
    total: parseFloat(total.toFixed(2))
  };
};

type AlertRule = { id: string; label: string; limitKwh: number; enabled: boolean; triggered: boolean };
const notifiedRules = new Map<string, number>();

const StatCard = ({ label, value, decimals, unit, color, icon, prefix, statusLabel }: {
  label: string; value: number; decimals: number; unit: string;
  color: string; icon: string; prefix?: string; statusLabel?: string;
}) => (
  <View style={[styles.statCard, { borderColor: color + '66', borderTopWidth: 3, borderTopColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <AnimatedNumber value={value} color={color} fontSize={24} decimals={decimals} prefix={prefix} />
    <Text style={styles.statUnit}>{unit}</Text>
    {statusLabel && (
      <View style={[styles.statBadge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.statBadgeText, { color }]}>{statusLabel}</Text>
      </View>
    )}
  </View>
);

export default function DashboardScreen() {
  const [uid,         setUid]         = useState<string | null>(null);
  const [power,       setPower]       = useState(0);
  const [current,     setCurrent]     = useState(0);
  const [voltage,     setVoltage]     = useState(0);
  const [units,       setUnits]       = useState(0);
  const [timestamp,   setTimestamp]   = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [isProtected, setIsProtected] = useState(true);

  const alertRulesRef = useRef<AlertRule[]>([]);
  const unsubReadings = useRef<(() => void) | null>(null);
  const unsubAlerts   = useRef<(() => void) | null>(null);
  const appState      = useRef(AppState.currentState);
  const uidRef        = useRef<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('tariffType').then((val) => {
      if (val !== null) setIsProtected(val === 'protected');
    });
  }, []);

  const handleTariffToggle = async (val: boolean) => {
    setIsProtected(val);
    await AsyncStorage.setItem('tariffType', val ? 'protected' : 'unprotected');
  };

  useEffect(() => { setupNotifications(); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        uidRef.current = user.uid;
      } else {
        setUid(null);
        uidRef.current = null;
        setLoading(false);
        router.replace('/login' as any);
      }
    });
    return () => unsub();
  }, []);

  const checkAlerts = async (kwh: number, userId: string) => {
    const now = Date.now();
    for (const rule of alertRulesRef.current) {
      if (!rule.enabled) continue;
      if (kwh >= rule.limitKwh) {
        const lastNotified = notifiedRules.get(rule.id) ?? 0;
        if (now - lastNotified >= 60000) {
          notifiedRules.set(rule.id, now);
          await sendAlert(`⚡ Alert: ${rule.label}`, `Usage of ${kwh.toFixed(3)} kWh exceeded ${rule.limitKwh} kWh.`);
          await update(ref(db, `users/${userId}/alerts/${rule.id}`), { triggered: true });
          await push(ref(db, `users/${userId}/alert_history`), {
            ruleId: rule.id, label: rule.label,
            limitKwh: rule.limitKwh, kwhAtTrigger: kwh, timestamp: now
          });
        }
      } else {
        notifiedRules.delete(rule.id);
        await update(ref(db, `users/${userId}/alerts/${rule.id}`), { triggered: false });
      }
    }
  };

  const attachListeners = useCallback((currentUid: string) => {
    unsubReadings.current?.();
    unsubAlerts.current?.();

    unsubAlerts.current = onValue(ref(db, `users/${currentUid}/alerts`), (snap) => {
      alertRulesRef.current = snap.exists()
        ? Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }))
        : [];
    });

    const timeout = setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 8000);

    unsubReadings.current = onValue(
      ref(db, `users/${currentUid}/readings`),
      async (snap) => {
        clearTimeout(timeout);
        if (snap.exists()) {
          const val = snap.val();
          setPower(  parseFloat(val.power   ?? 0));
          setCurrent(parseFloat(val.current ?? 0));
          setVoltage(parseFloat(val.voltage ?? 0));
          setUnits(  parseFloat(val.kwh     ?? 0));
          const rawTs = Number(val.timestamp ?? 0);
          setTimestamp(rawTs > 0 ? (rawTs < 10000000000 ? rawTs * 1000 : rawTs) : null);
          await checkAlerts(parseFloat(val.kwh ?? 0), currentUid);
        }
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.log('Database error:', error.message);
        clearTimeout(timeout);
        setLoading(false);
        setRefreshing(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!uid) return;
    attachListeners(uid);
    return () => {
      unsubReadings.current?.();
      unsubAlerts.current?.();
    };
  }, [uid, attachListeners]);

  useEffect(() => {
    if (refreshing && uid) attachListeners(uid);
  }, [refreshing, uid, attachListeners]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const currentUid = uidRef.current;
        if (currentUid) attachListeners(currentUid);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [attachListeners]);

  const handleLogout = () => {
    const doLogout = () => {
      unsubReadings.current?.();
      unsubAlerts.current?.();
      signOut(auth).catch((e) => console.log('Logout error:', e));
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) doLogout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?',
        [{ text: 'Cancel', style: 'cancel' },
         { text: 'Log Out', style: 'destructive', onPress: doLogout }],
        { cancelable: true }
      );
    }
  };

  const handleMonthReset = () => {
    if (!uid) return;
    const bill  = calculateFullBill(units, isProtected);
    const now   = new Date();
    const month = now.toLocaleString('en-PK', { month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' });
    const endTs = Math.floor(Date.now() / 1000);

    const doReset = async () => {
      try {
        const startSnap = await get(ref(db, `users/${uid}/readings/cycleStartDate`));
        const startTs   = startSnap.exists() ? startSnap.val() : endTs;

        // ✅ Sab ek saath — Promise.all se parallel execution
        await Promise.all([
          push(ref(db, `users/${uid}/billing_history`), {
            month,
            units:      parseFloat(units.toFixed(4)),
            bill:       parseFloat(bill.total.toFixed(2)),
            startDate:  startTs,
            endDate:    endTs,
            resetDate:  endTs,
            tariffType: isProtected ? 'protected' : 'unprotected',
          }),
          update(ref(db, `users/${uid}/readings`), {
            resetFlag:      true,
            kwh:            0,
            cycleStartDate: endTs,
          }),
          set(ref(db, `users/${uid}/readings_history`), null),
        ]);

        if (Platform.OS === 'web') {
          window.alert('Success! Billing record has been saved. A new billing cycle has started from today.');
        } else {
          Alert.alert('Success', `Billing record for ${month} has been saved.\nA new billing cycle has started from today.`);
        }
      } catch (e) {
        if (Platform.OS === 'web') {
          window.alert('Error: Failed to save the billing record. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to save the billing record. Please try again.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Reset Billing Cycle?\n\nMonth: ${month}\nTariff: ${isProtected ? 'Protected (A-1a)' : 'Unprotected (A-1)'}\nUnits: ${units.toFixed(2)} kWh\nEstimated Bill: ₨${bill.total.toFixed(0)}\n\nThis will save the record, reset kWh to zero, and clear reading history.`
      );
      if (confirmed) doReset();
    } else {
      Alert.alert(
        'Reset Billing Cycle',
        `Billing Month: ${month}\nTariff Type: ${isProtected ? 'Protected (A-1a)' : 'Unprotected (A-1)'}\nTotal Units: ${units.toFixed(2)} kWh\nEstimated Bill: ₨${bill.total.toFixed(0)}\n\nThis will save the record, reset kWh to zero, and clear reading history.`,
        [{ text: 'Cancel', style: 'cancel' },
         { text: 'Confirm Reset', style: 'destructive', onPress: doReset }],
        { cancelable: true }
      );
    }
  };

  const bill = calculateFullBill(units, isProtected);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={NORMAL} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard ⚡</Text>
          <Text style={styles.sub}>Live Electricity Monitor</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={handleLogout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 80 }}>
          <ActivityIndicator color={NORMAL} size="large" />
          <Text style={{ color: '#3A4A6B', marginTop: 16, fontSize: 13 }}>Connecting to Firebase...</Text>
        </View>
      ) : (
        <>
          {/* Tariff Type Selector */}
          <View style={styles.tariffToggleCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tariffToggleTitle}>Tariff Category</Text>
              <Text style={styles.tariffToggleSub}>
                {isProtected
                  ? '🟢 Protected (A-1a) — Consumption below 200 units'
                  : '🔴 Unprotected (A-1) — Consumption exceeded 200 units'}
              </Text>
            </View>
            <Switch
              value={!isProtected}
              onValueChange={(v) => handleTariffToggle(!v)}
              trackColor={{ false: '#00D4FF44', true: '#FF4C6A44' }}
              thumbColor={isProtected ? NORMAL : DANGER}
            />
          </View>

          {/* Live Power Card */}
          <View style={[styles.mainCard, { borderColor: getPowerColor(power) + '44' }]}>
            <View style={[styles.statusBadge, { backgroundColor: getPowerColor(power) + '22', borderColor: getPowerColor(power) }]}>
              <Text style={[styles.statusText, { color: getPowerColor(power) }]}>{getPowerLabel(power)}</Text>
            </View>
            <AnimatedNumber value={power} color={getPowerColor(power)} fontSize={72} decimals={0} />
            <Text style={styles.powerUnit}>Watts — Live Power Consumption</Text>
            <View style={styles.powerLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: NORMAL }]} /><Text style={styles.legendText}>Normal &lt; 1500W</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: DANGER }]} /><Text style={styles.legendText}>High &gt; 1500W</Text></View>
            </View>
          </View>

          <View style={styles.grid}>
            <StatCard label="Current" value={current} decimals={2} unit="Amperes" color={getCurrentColor(current)} icon="⚡" statusLabel={getCurrentLabel(current)} />
            <StatCard label="Voltage" value={voltage} decimals={1} unit="Volts"   color={getVoltageColor(voltage)} icon="🔋" statusLabel={getVoltageLabel(voltage)} />
          </View>
          <View style={styles.grid}>
            <StatCard label="Units Used" value={units}      decimals={3} unit="kWh"                  color={getKwhColor(units)}             icon="📊" />
            <StatCard label="Est. Bill"  value={bill.total} decimals={0} unit="Includes all charges" color={getBillColor(bill.total, units)} icon="🧾" prefix="₨" />
          </View>

          <Text style={styles.updatedText}>
            Last Updated:{' '}
            {timestamp
              ? new Date(timestamp).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
              : 'Awaiting data from ESP32...'}
          </Text>

          {/* Reset Billing Cycle */}
          <Pressable style={({ pressed }) => [styles.resetMonthBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleMonthReset} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
            <Text style={styles.resetMonthIcon}>🔄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.resetMonthTitle}>Reset Billing Cycle</Text>
              <Text style={styles.resetMonthSub}>Save this month's record and begin a new billing cycle</Text>
            </View>
            <Text style={{ color: DANGER, fontSize: 18 }}>›</Text>
          </Pressable>

          {/* Estimated Bill Breakdown */}
          <View style={styles.billCard}>
            <Text style={[styles.billTitle, { color: GOLD }]}>🧾 Estimated Bill Breakdown</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tariff Category</Text>
              <Text style={[styles.billValue, { color: isProtected ? NORMAL : DANGER }]}>
                {isProtected ? 'Protected (A-1a)' : 'Unprotected (A-1)'}
              </Text>
            </View>
            {[
              { label: 'Electricity Charges',        value: bill.unitsCost       },
              { label: 'Fuel Price Adjustment (FPA)', value: bill.fpa             },
              { label: 'FC Surcharge',                value: bill.fcSurcharge     },
              { label: 'Quarterly Tariff Adjustment', value: bill.quarterlyAdj    },
              { label: 'Electricity Duty (1.5%)',     value: bill.electricityDuty },
              { label: 'General Sales Tax (18%)',     value: bill.gst             },
              { label: 'Income Tax',                  value: bill.incomeTax       },
            ].map((item, i) => (
              <View key={i} style={styles.billRow}>
                <Text style={styles.billLabel}>{item.label}</Text>
                <Text style={styles.billValue}>₨{item.value.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalLabel}>TOTAL PAYABLE</Text>
              <Text style={styles.billTotalValue}>₨{bill.total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerText}>
              ⚠️ Disclaimer: This is an estimated bill. Actual amount may vary due to government subsidies, NEPRA adjustments, and other charges applied directly by LESCO.
            </Text>
          </View>

          {/* LESCO Tariff Reference */}
          <View style={styles.tariffCard}>
            <Text style={styles.tariffTitle}>
              📋 LESCO Tariff Reference — {isProtected ? 'Protected (A-1a) 2026' : 'Unprotected (A-1) 2026'}
            </Text>
            {(isProtected ? [
              { slab: '0 – 100 kWh',   rate: '₨10.54 / unit' },
              { slab: '101 – 200 kWh', rate: '₨12.67 / unit' },
            ] : [
              { slab: '0 – 100 kWh',   rate: '₨23.59 / unit' },
              { slab: '101 – 200 kWh', rate: '₨30.10 / unit' },
              { slab: '201 – 300 kWh', rate: '₨34.26 / unit' },
              { slab: '301 – 400 kWh', rate: '₨39.15 / unit' },
              { slab: '401 – 500 kWh', rate: '₨41.36 / unit' },
              { slab: '501 – 600 kWh', rate: '₨42.78 / unit' },
              { slab: '601 – 700 kWh', rate: '₨43.92 / unit' },
              { slab: '700+ kWh',      rate: '₨48.84 / unit' },
            ]).map((t, i) => (
              <View key={i} style={styles.tariffRow}>
                <Text style={styles.tariffSlab}>{t.slab}</Text>
                <Text style={styles.tariffRate}>{t.rate}</Text>
              </View>
            ))}
          </View>

          {/* Energy Saving Tip */}
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Energy Saving Tip</Text>
            <Text style={styles.tipText}>
              Running high-load appliances during off-peak hours (9:00 PM – 7:00 AM) can reduce your monthly electricity bill by up to 30%.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const BG = '#0A0F1E', CARD = '#111827', BORDER = '#1A2540';
const styles = StyleSheet.create({
  scroll:             { backgroundColor: BG },
  container:          { padding: 20, paddingBottom: 40 },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 8 },
  title:              { color: '#FFD700', fontSize: 26, fontWeight: '800' },
  sub:                { color: '#AAB4C8', fontSize: 14, marginTop: 2 },
  logoutBtn:          { backgroundColor: '#FF4C6A22', borderRadius: 10, borderWidth: 1, borderColor: '#FF4C6A55', paddingHorizontal: 14, paddingVertical: 8 },
  logoutText:         { color: DANGER, fontWeight: '700', fontSize: 13 },
  tariffToggleCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 14 },
  tariffToggleTitle:  { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  tariffToggleSub:    { color: '#AAB4C8', fontSize: 12 },
  mainCard:           { backgroundColor: CARD, borderRadius: 20, borderWidth: 1, padding: 36, marginBottom: 14, alignItems: 'center' },
  statusBadge:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 16 },
  statusText:         { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  powerUnit:          { color: '#3A4A6B', fontSize: 13, marginTop: 8 },
  powerLegend:        { flexDirection: 'row', gap: 16, marginTop: 16 },
  legendItem:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:          { width: 8, height: 8, borderRadius: 4 },
  legendText:         { color: '#AAB4C8', fontSize: 11 },
  grid:               { flexDirection: 'row', gap: 14, marginBottom: 14 },
  statCard:           { flex: 1, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, alignItems: 'center' },
  statIcon:           { fontSize: 22, marginBottom: 6 },
  statLabel:          { color: '#3A4A6B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  statUnit:           { color: '#3A4A6B', fontSize: 10, marginTop: 4 },
  statBadge:          { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statBadgeText:      { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  updatedText:        { color: '#3A4A6B', fontSize: 12, textAlign: 'center', marginBottom: 14, marginTop: 4 },
  resetMonthBtn:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FF4C6A18', borderRadius: 16, borderWidth: 1.5, borderColor: '#FF4C6A66', padding: 18, marginBottom: 14 },
  resetMonthIcon:     { fontSize: 28 },
  resetMonthTitle:    { color: '#FF4C6A', fontSize: 15, fontWeight: '800' },
  resetMonthSub:      { color: '#AAB4C8', fontSize: 11, marginTop: 3 },
  billCard:           { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: '#FF4C6A33', padding: 18, marginBottom: 14 },
  billTitle:          { fontWeight: '700', fontSize: 14, marginBottom: 12 },
  billRow:            { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
  billLabel:          { color: '#AAB4C8', fontSize: 13 },
  billValue:          { color: '#AAB4C8', fontSize: 13, fontWeight: '600' },
  billTotalRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
  billTotalLabel:     { color: '#FFD700', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  billTotalValue:     { color: '#FFD700', fontSize: 18, fontWeight: '900' },
  disclaimerCard:     { backgroundColor: '#FFB80011', borderRadius: 16, padding: 14, borderLeftWidth: 3, borderLeftColor: '#FFB800', marginBottom: 14 },
  disclaimerText:     { color: '#FFB800', fontSize: 11, lineHeight: 17 },
  tariffCard:         { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 18, marginBottom: 14 },
  tariffTitle:        { color: '#AAB4C8', fontWeight: '700', fontSize: 14, marginBottom: 12 },
  tariffRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: BORDER },
  tariffSlab:         { color: '#AAB4C8', fontSize: 13 },
  tariffRate:         { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  tipCard:            { backgroundColor: '#FFB8000A', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#FFB800', marginTop: 4 },
  tipTitle:           { color: '#FFB800', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  tipText:            { color: '#AAB4C8', fontSize: 13, lineHeight: 20 },
});