// import { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Switch,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { ref, push, onValue, remove, update, query, orderByChild } from 'firebase/database';
// import { db } from '../lib/firebaseConfig';

// type AlertRule = { id: string; label: string; limitWatts: number; enabled: boolean; triggered: boolean };

// export default function AlertsScreen() {
//   const [rules, setRules] = useState<AlertRule[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [label, setLabel] = useState('');
//   const [limitWatts, setLimitWatts] = useState('');

//   useEffect(() => {
//     const q = query(ref(db, 'alerts'), orderByChild('limitWatts'));
//     const unsub = onValue(q, (snap) => {
//       if (snap.exists()) {
//         const data = snap.val();
//         const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
//         list.sort((a, b) => b.limitWatts - a.limitWatts); // high first
//         setRules(list);
//       } else {
//         setRules([]);
//       }
//       setLoading(false);
//     });
//     return () => unsub();
//   }, []);

//   const addRule = async () => {
//     if (!label || !limitWatts) {
//       Alert.alert('Missing fields', 'Please provide a label and watt limit.');
//       return;
//     }
//     await push(ref(db, 'alerts'), {
//       label,
//       limitWatts: parseInt(limitWatts, 10),
//       enabled: true,
//       triggered: false,
//     });
//     setLabel('');
//     setLimitWatts('');
//   };

//   const toggleRule = (rule: AlertRule) =>
//     update(ref(db, `alerts/${rule.id}`), { enabled: !rule.enabled });

//   const deleteRule = (id: string) => {
//     Alert.alert('Delete Alert', 'Remove this alert rule?', [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Delete', style: 'destructive', onPress: () => remove(ref(db, `alerts/${id}`)) },
//     ]);
//   };

//   return (
//     <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
//       <Text style={styles.title}>Usage Alerts</Text>
//       <Text style={styles.sub}>Get notified when usage exceeds your limits</Text>

//       <View style={styles.infoBanner}>
//         <Text style={styles.infoText}>
//           ℹ️ Alert rules are saved in Firebase. Pair with Cloud Functions or device firmware to trigger notifications.
//         </Text>
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.formTitle}>New Alert Rule</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Label (e.g. Peak usage warning)"
//           placeholderTextColor="#3A4A6B"
//           value={label}
//           onChangeText={setLabel}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Watt limit (e.g. 2000)"
//           placeholderTextColor="#3A4A6B"
//           keyboardType="numeric"
//           value={limitWatts}
//           onChangeText={setLimitWatts}
//         />
//         <TouchableOpacity style={styles.btn} onPress={addRule}>
//           <Text style={styles.btnText}>Add Alert</Text>
//         </TouchableOpacity>
//       </View>

//       <Text style={styles.sectionTitle}>Your Alert Rules</Text>

//       {loading ? (
//         <ActivityIndicator color="#00D4FF" style={{ marginTop: 20 }} />
//       ) : rules.length === 0 ? (
//         <View style={styles.empty}>
//           <Text style={styles.emptyText}>No alert rules set yet.</Text>
//           <Text style={styles.emptyHint}>Add a rule above to get started.</Text>
//         </View>
//       ) : (
//         rules.map((r) => (
//           <TouchableOpacity
//             key={r.id}
//             style={[styles.ruleRow, !r.enabled && styles.ruleDisabled]}
//             onLongPress={() => deleteRule(r.id)}
//           >
//             <View style={{ flex: 1 }}>
//               <Text style={styles.ruleLabel}>{r.label}</Text>
//               <Text style={styles.ruleLimit}>Limit: {r.limitWatts.toLocaleString()} W</Text>
//               {r.triggered && r.enabled && (
//                 <View style={styles.triggeredBadge}>
//                   <Text style={styles.triggeredText}>⚠ TRIGGERED</Text>
//                 </View>
//               )}
//             </View>
//             <Switch
//               value={r.enabled}
//               onValueChange={() => toggleRule(r)}
//               trackColor={{ false: '#1A2540', true: '#00D4FF44' }}
//               thumbColor={r.enabled ? '#00D4FF' : '#3A4A6B'}
//             />
//           </TouchableOpacity>
//         ))
//       )}

//       <Text style={styles.hint}>Long press a rule to delete it.</Text>
//     </ScrollView>
//   );
// }

// const BG = '#0A0F1E',
//   CARD = '#111827',
//   BORDER = '#1A2540',
//   ACCENT = '#00D4FF';

// const styles = StyleSheet.create({
//   scroll: { backgroundColor: BG },
//   container: { padding: 20, paddingBottom: 40 },
//   title: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 8 },
//   sub: { color: '#3A4A6B', fontSize: 14, marginBottom: 20, marginTop: 2 },
//   infoBanner: { backgroundColor: '#00D4FF0D', borderRadius: 12, borderWidth: 1, borderColor: '#00D4FF33', padding: 14, marginBottom: 20 },
//   infoText: { color: '#AAB4C8', fontSize: 12, lineHeight: 18 },
//   card: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 20, marginBottom: 20 },
//   formTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
//   input: { backgroundColor: '#0A0F1E', borderRadius: 10, borderWidth: 1, borderColor: BORDER, color: '#FFFFFF', padding: 12, marginBottom: 10, fontSize: 14 },
//   btn: { backgroundColor: ACCENT, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
//   btnText: { color: '#0A0F1E', fontWeight: '800', fontSize: 15 },
//   sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
//   ruleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 8 },
//   ruleDisabled: { opacity: 0.5 },
//   ruleLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
//   ruleLimit: { color: '#3A4A6B', fontSize: 12 },
//   triggeredBadge: { marginTop: 6, backgroundColor: '#FF4C6A22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FF4C6A44' },
//   triggeredText: { color: '#FF4C6A', fontSize: 10, fontWeight: '700' },
//   empty: { alignItems: 'center', marginTop: 10 },
//   emptyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
//   emptyHint: { color: '#3A4A6B', fontSize: 12 },
//   hint: { color: '#3A4A6B', fontSize: 11, textAlign: 'center', marginTop: 8 },
// });
// app/alerts.tsx
// Push notifications via expo-notifications (works on Android & iOS)
// Install: npx expo install expo-notifications

// app/alerts.tsx
// Push notifications via expo-notifications (works on Android & iOS)
// Install: npx expo install expo-notifications

// import { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Switch,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { ref, push, onValue, remove, update, query, orderByChild } from 'firebase/database';
// import { db } from '../lib/firebaseConfig';

// type AlertRule = { id: string; label: string; limitWatts: number; enabled: boolean; triggered: boolean };

// export default function AlertsScreen() {
//   const [rules, setRules] = useState<AlertRule[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [label, setLabel] = useState('');
//   const [limitWatts, setLimitWatts] = useState('');

//   useEffect(() => {
//     const q = query(ref(db, 'alerts'), orderByChild('limitWatts'));
//     const unsub = onValue(q, (snap) => {
//       if (snap.exists()) {
//         const data = snap.val();
//         const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
//         list.sort((a, b) => b.limitWatts - a.limitWatts); // high first
//         setRules(list);
//       } else {
//         setRules([]);
//       }
//       setLoading(false);
//     });
//     return () => unsub();
//   }, []);

//   const addRule = async () => {
//     if (!label || !limitWatts) {
//       Alert.alert('Missing fields', 'Please provide a label and watt limit.');
//       return;
//     }
//     await push(ref(db, 'alerts'), {
//       label,
//       limitWatts: parseInt(limitWatts, 10),
//       enabled: true,
//       triggered: false,
//     });
//     setLabel('');
//     setLimitWatts('');
//   };

//   const toggleRule = (rule: AlertRule) =>
//     update(ref(db, `alerts/${rule.id}`), { enabled: !rule.enabled });

//   const deleteRule = (id: string) => {
//     Alert.alert('Delete Alert', 'Remove this alert rule?', [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Delete', style: 'destructive', onPress: () => remove(ref(db, `alerts/${id}`)) },
//     ]);
//   };

//   return (
//     <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
//       <Text style={styles.title}>Usage Alerts</Text>
//       <Text style={styles.sub}>Get notified when usage exceeds your limits</Text>

//       <View style={styles.infoBanner}>
//         <Text style={styles.infoText}>
//           ℹ️ Alert rules are saved in Firebase. Pair with Cloud Functions or device firmware to trigger notifications.
//         </Text>
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.formTitle}>New Alert Rule</Text>
//         <TextInput
//           style={styles.input}
//           placeholder="Label (e.g. Peak usage warning)"
//           placeholderTextColor="#3A4A6B"
//           value={label}
//           onChangeText={setLabel}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Watt limit (e.g. 2000)"
//           placeholderTextColor="#3A4A6B"
//           keyboardType="numeric"
//           value={limitWatts}
//           onChangeText={setLimitWatts}
//         />
//         <TouchableOpacity style={styles.btn} onPress={addRule}>
//           <Text style={styles.btnText}>Add Alert</Text>
//         </TouchableOpacity>
//       </View>

//       <Text style={styles.sectionTitle}>Your Alert Rules</Text>

//       {loading ? (
//         <ActivityIndicator color="#00D4FF" style={{ marginTop: 20 }} />
//       ) : rules.length === 0 ? (
//         <View style={styles.empty}>
//           <Text style={styles.emptyText}>No alert rules set yet.</Text>
//           <Text style={styles.emptyHint}>Add a rule above to get started.</Text>
//         </View>
//       ) : (
//         rules.map((r) => (
//           <TouchableOpacity
//             key={r.id}
//             style={[styles.ruleRow, !r.enabled && styles.ruleDisabled]}
//             onLongPress={() => deleteRule(r.id)}
//           >
//             <View style={{ flex: 1 }}>
//               <Text style={styles.ruleLabel}>{r.label}</Text>
//               <Text style={styles.ruleLimit}>Limit: {r.limitWatts.toLocaleString()} W</Text>
//               {r.triggered && r.enabled && (
//                 <View style={styles.triggeredBadge}>
//                   <Text style={styles.triggeredText}>⚠ TRIGGERED</Text>
//                 </View>
//               )}
//             </View>
//             <Switch
//               value={r.enabled}
//               onValueChange={() => toggleRule(r)}
//               trackColor={{ false: '#1A2540', true: '#00D4FF44' }}
//               thumbColor={r.enabled ? '#00D4FF' : '#3A4A6B'}
//             />
//           </TouchableOpacity>
//         ))
//       )}

//       <Text style={styles.hint}>Long press a rule to delete it.</Text>
//     </ScrollView>
//   );
// }

// const BG = '#0A0F1E',
//   CARD = '#111827',
//   BORDER = '#1A2540',
//   ACCENT = '#00D4FF';

// const styles = StyleSheet.create({
//   scroll: { backgroundColor: BG },
//   container: { padding: 20, paddingBottom: 40 },
//   title: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 8 },
//   sub: { color: '#3A4A6B', fontSize: 14, marginBottom: 20, marginTop: 2 },
//   infoBanner: { backgroundColor: '#00D4FF0D', borderRadius: 12, borderWidth: 1, borderColor: '#00D4FF33', padding: 14, marginBottom: 20 },
//   infoText: { color: '#AAB4C8', fontSize: 12, lineHeight: 18 },
//   card: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 20, marginBottom: 20 },
//   formTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
//   input: { backgroundColor: '#0A0F1E', borderRadius: 10, borderWidth: 1, borderColor: BORDER, color: '#FFFFFF', padding: 12, marginBottom: 10, fontSize: 14 },
//   btn: { backgroundColor: ACCENT, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
//   btnText: { color: '#0A0F1E', fontWeight: '800', fontSize: 15 },
//   sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
//   ruleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 8 },
//   ruleDisabled: { opacity: 0.5 },
//   ruleLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
//   ruleLimit: { color: '#3A4A6B', fontSize: 12 },
//   triggeredBadge: { marginTop: 6, backgroundColor: '#FF4C6A22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FF4C6A44' },
//   triggeredText: { color: '#FF4C6A', fontSize: 10, fontWeight: '700' },
//   empty: { alignItems: 'center', marginTop: 10 },
//   emptyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
//   emptyHint: { color: '#3A4A6B', fontSize: 12 },
//   hint: { color: '#3A4A6B', fontSize: 11, textAlign: 'center', marginTop: 8 },
// });
// app/alerts.tsx
// Push notifications via expo-notifications (works on Android & iOS)
// Install: npx expo install expo-notifications
// app/alerts.tsx
// Push notifications via expo-notifications (works on Android & iOS)
// Install: npx expo install expo-notifications
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Platform,
  TouchableOpacity, Switch, Alert, ActivityIndicator,
  AppState, AppStateStatus,
} from 'react-native';
import { ref, push, onValue, remove, update, query, orderByChild } from 'firebase/database';
import { db, auth } from '../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Notifications sirf mobile pe load karo
let Notifications: any = null;
let Device: any = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device        = require('expo-device');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

type AlertRule = {
  id: string;
  label: string;
  limitKwh: number;
  enabled: boolean;
  triggered: boolean;
};

async function registerForNotifications() {
  if (Platform.OS === 'web' || !Notifications || !Device?.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive alerts.');
  }
}

async function sendNotification(title: string, body: string) {
  if (Platform.OS === 'web' || !Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title, body, sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: '#FF4C6A',
    },
    trigger: null,
  });
}

const NORMAL = '#00D4FF';
const DANGER = '#FF4C6A';
const getPowerColor = (w: number) => w > 1500 ? DANGER : NORMAL;
const getKwhColor   = (k: number) => k > 300 ? DANGER : NORMAL;

const notifiedRules = new Map<string, number>();

export default function AlertsScreen() {
  const [rules, setRules]               = useState<AlertRule[]>([]);
  const [loading, setLoading]           = useState(true);
  const [label, setLabel]               = useState('');
  const [limitKwh, setLimitKwh]         = useState('');
  const [currentKwh, setCurrentKwh]     = useState(0);
  const [currentPower, setCurrentPower] = useState(0);
  const [uid, setUid]                   = useState<string | null>(null);

  const rulesRef      = useRef<AlertRule[]>([]);
  const unsubRules    = useRef<(() => void) | null>(null);
  const unsubKwh      = useRef<(() => void) | null>(null);
  const unsubPower    = useRef<(() => void) | null>(null);
  const appState      = useRef(AppState.currentState);

  useEffect(() => { registerForNotifications(); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
      if (!user) setLoading(false);
    });
    return () => unsub();
  }, []);

  const checkAlerts = async (kwh: number, currentUid: string) => {
    const now          = Date.now();
    const currentRules = rulesRef.current;
    for (const rule of currentRules) {
      if (!rule.enabled) continue;
      if (kwh >= rule.limitKwh) {
        const lastNotified = notifiedRules.get(rule.id) ?? 0;
        if (now - lastNotified >= 60000) {
          notifiedRules.set(rule.id, now);
          await sendNotification(
            `⚡ Alert: ${rule.label}`,
            `Usage of ${kwh.toFixed(3)} kWh has exceeded the limit of ${rule.limitKwh} kWh!`
          );
          await update(ref(db, `users/${currentUid}/alerts/${rule.id}`), { triggered: true });
          await push(ref(db, `users/${currentUid}/alert_history`), {
            ruleId: rule.id, label: rule.label, limitKwh: rule.limitKwh,
            kwhAtTrigger: kwh, timestamp: Date.now(),
          });
        }
      } else {
        notifiedRules.delete(rule.id);
        await update(ref(db, `users/${currentUid}/alerts/${rule.id}`), { triggered: false });
      }
    }
  };

  const attachListeners = useCallback((currentUid: string) => {
    unsubRules.current?.();
    unsubKwh.current?.();
    unsubPower.current?.();

    setLoading(true);

    const q = query(ref(db, `users/${currentUid}/alerts`), orderByChild('limitKwh'));
    unsubRules.current = onValue(q, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        list.sort((a: AlertRule, b: AlertRule) => b.limitKwh - a.limitKwh);
        setRules(list);
        rulesRef.current = list;
      } else {
        setRules([]);
        rulesRef.current = [];
      }
      setLoading(false);
    }, () => setLoading(false));

    unsubKwh.current = onValue(ref(db, `users/${currentUid}/readings/kwh`), (snap) => {
      if (snap.exists()) {
        const kwh = snap.val() as number;
        setCurrentKwh(kwh);
        checkAlerts(kwh, currentUid);
      }
    });

    unsubPower.current = onValue(ref(db, `users/${currentUid}/readings/power`), (snap) => {
      if (snap.exists()) setCurrentPower(snap.val() as number);
    });
  }, []);

  useEffect(() => {
    if (!uid) return;
    attachListeners(uid);
    return () => {
      unsubRules.current?.();
      unsubKwh.current?.();
      unsubPower.current?.();
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

  const addRule = async () => {
    if (!uid) return;
    if (!label || !limitKwh) {
      Alert.alert('Missing Fields', 'Please enter both a label and a unit threshold to continue.');
      return;
    }
    const kwh = parseFloat(limitKwh);
    if (isNaN(kwh) || kwh <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid numeric value for the unit threshold.');
      return;
    }
    await push(ref(db, `users/${uid}/alerts`), { label, limitKwh: kwh, enabled: true, triggered: false });
    setLabel('');
    setLimitKwh('');
  };

  const toggleRule = (rule: AlertRule) => {
    if (!uid) return;
    update(ref(db, `users/${uid}/alerts/${rule.id}`), { enabled: !rule.enabled });
  };

  const deleteRule = (id: string) => {
    if (!uid) return;
    Alert.alert('Delete Alert Rule', 'Are you sure you want to delete this alert rule? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(ref(db, `users/${uid}/alerts/${id}`)) },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: '#FFD700' }]}>Usage Alerts⚡</Text>
      <Text style={styles.sub}>Receive notifications when your energy consumption exceeds the defined threshold.</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: getKwhColor(currentKwh) + '44' }]}>
          <Text style={styles.statLabel}>Live Units</Text>
          <Text style={[styles.statValue, { color: getKwhColor(currentKwh) }]}>{currentKwh.toFixed(3)}</Text>
          <Text style={styles.statUnit}>kWh</Text>
        </View>
        <View style={[styles.statCard, { borderColor: getPowerColor(currentPower) + '44' }]}>
          <Text style={styles.statLabel}>Live Power</Text>
          <Text style={[styles.statValue, { color: getPowerColor(currentPower) }]}>{currentPower.toFixed(0)}</Text>
          <Text style={styles.statUnit}>Watts</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.formTitle, { color: '#FFD700' }]}>➕ New Alert Rule</Text>
        <TextInput
          style={styles.input}
          placeholder="Label  (e.g. Monthly Limit)"
          placeholderTextColor="#3A4A6B"
          value={label}
          onChangeText={setLabel}
        />
        <TextInput
          style={styles.input}
          placeholder="Unit threshold in kWh  (e.g. 100)"
          placeholderTextColor="#3A4A6B"
          keyboardType="numeric"
          value={limitKwh}
          onChangeText={setLimitKwh}
        />
        <TouchableOpacity style={styles.btn} onPress={addRule}>
          <Text style={styles.btnText}>+ Add Alert Rule</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Alert Rules</Text>
      <Text style={styles.hint}>Long press on a rule to delete it.</Text>

      {loading ? (
        <ActivityIndicator color="#00D4FF" style={{ marginTop: 20 }} />
      ) : rules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No alert rules configured.</Text>
          <Text style={styles.emptyHint}>Add a rule above to get started.</Text>
        </View>
      ) : (
        rules.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.ruleRow, !r.enabled && styles.ruleDisabled, r.triggered && r.enabled && styles.ruleTriggered]}
            onLongPress={() => deleteRule(r.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleLabel}>{r.label}</Text>
              <Text style={styles.ruleLimit}>Threshold: {r.limitKwh} kWh</Text>
              {r.triggered && r.enabled && (
                <View style={styles.triggeredBadge}>
                  <Text style={styles.triggeredText}>⚠ TRIGGERED — Consumption threshold exceeded!</Text>
                </View>
              )}
            </View>
            <Switch
              value={r.enabled}
              onValueChange={() => toggleRule(r)}
              trackColor={{ false: '#1A2540', true: '#00D4FF44' }}
              thumbColor={r.enabled ? '#00D4FF' : '#3A4A6B'}
            />
          </TouchableOpacity>
        ))
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
  statsRow:         { flexDirection: 'row', gap: 14, marginBottom: 16 },
  statCard:         { flex: 1, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, padding: 18, alignItems: 'center' },
  statLabel:        { color: '#3A4A6B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  statValue:        { fontSize: 26, fontWeight: '800' },
  statUnit:         { color: '#3A4A6B', fontSize: 11, marginTop: 4 },
  card:             { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 20, marginBottom: 20 },
  formTitle:        { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input:            { backgroundColor: '#0A0F1E', borderRadius: 10, borderWidth: 1, borderColor: BORDER, color: '#FFFFFF', padding: 12, marginBottom: 10, fontSize: 14 },
  btn:              { backgroundColor: '#FFD700', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  btnText:          { color: '#0A0F1E', fontWeight: '800', fontSize: 15 },
  sectionTitle:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  hint:             { color: '#3A4A6B', fontSize: 11, marginBottom: 12 },
  ruleRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 8 },
  ruleTriggered:    { borderColor: '#FF4C6A66', backgroundColor: '#FF4C6A08' },
  ruleDisabled:     { opacity: 0.4 },
  ruleLabel:        { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  ruleLimit:        { color: '#3A4A6B', fontSize: 12, marginTop: 2 },
  triggeredBadge:   { marginTop: 6, backgroundColor: '#FF4C6A22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FF4C6A44' },
  triggeredText:    { color: '#FF4C6A', fontSize: 10, fontWeight: '700' },
  empty:            { alignItems: 'center', marginTop: 20 },
  emptyText:        { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  emptyHint:        { color: '#3A4A6B', fontSize: 12 },
});