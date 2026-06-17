// app/login.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../lib/firebaseConfig';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('❌ Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('❌ Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const timeout = setTimeout(() => {
      setLoading(false);
      setErrorMsg('❌ Connection timed out. Check your internet and try again.');
    }, 15000);

    try {
      if (isSignUp) {
        // ✅ Naya account banao
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newUid = userCredential.user.uid;

        // ✅ Naye user ka 0 data Firebase mein save karo
        await set(ref(db, `users/${newUid}/readings`), {
          voltage:        0,
          current:        0,
          power:          0,
          kwh:            0,
          timestamp:      0,
          cycleStartDate: Math.floor(Date.now() / 1000),
        });

        clearTimeout(timeout);
        setLoading(false);
        Alert.alert('✅ Account Created', 'Welcome to Electricity Monitor!', [
          { text: 'Continue', onPress: () => router.replace('/' as any) }
        ]);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        clearTimeout(timeout);
        setLoading(false);
        router.replace('/' as any);
      }
    } catch (error: any) {
      clearTimeout(timeout);
      setLoading(false);
      let msg = '❌ Something went wrong. Please try again.';
      if      (error.code === 'auth/user-not-found')        msg = '❌ No account found with this email.';
      else if (error.code === 'auth/wrong-password')        msg = '❌ Incorrect password. Please try again.';
      else if (error.code === 'auth/invalid-email')         msg = '❌ Please enter a valid email address.';
      else if (error.code === 'auth/invalid-credential')    msg = '❌ Invalid email or password.';
      else if (error.code === 'auth/email-already-in-use')  msg = '❌ This email is already registered. Sign in instead.';
      else if (error.code === 'auth/network-request-failed') msg = '❌ Network error. Check your internet connection.';
      else if (error.code === 'auth/too-many-requests')     msg = '❌ Too many attempts. Please wait and try again.';
      setErrorMsg(msg);
    }
  };

  // ... baaki UI code same rehta hai
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>⚡</Text>
          <Text style={styles.logoTitle}>Electricity Monitor</Text>
          <Text style={styles.logoSub}>IoT-Enabled Home Energy Management System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.cardSub}>
            {isSignUp
              ? 'Register to begin monitoring your energy'
              : 'Sign in to access your energy dashboard'}
          </Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor="#3A4A6B"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrorMsg(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder={isSignUp ? 'Minimum 6 characters' : 'Enter your password'}
            placeholderTextColor="#3A4A6B"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrorMsg(''); }}
            secureTextEntry
            editable={!loading}
          />

          {errorMsg !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#0A0F1E" size="small" />
              : <Text style={styles.btnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            }
          </TouchableOpacity>

          {!isSignUp && !loading && (
            <Text style={styles.hintText}>
              ⚠️ Make sure your email and password are correct.
            </Text>
          )}

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Lahore Garrison University  •  Final Year Project 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BG = '#0A0F1E', CARD = '#111827', BORDER = '#1A2540';
const styles = StyleSheet.create({
  container:  { flexGrow: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoBox:    { alignItems: 'center', marginBottom: 36 },
  logoIcon:   { fontSize: 64, marginBottom: 8 },
  logoTitle:  { color: '#FFD700', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  logoSub:    { color: '#3A4A6B', fontSize: 13, marginTop: 4 },
  card:       { width: '100%', backgroundColor: CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 24 },
  cardTitle:  { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardSub:    { color: '#3A4A6B', fontSize: 13, marginBottom: 24 },
  label:      { color: '#AAB4C8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:      { backgroundColor: BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER, color: '#FFFFFF', padding: 14, marginBottom: 16, fontSize: 14 },
  btn:        { backgroundColor: '#FFD700', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText:    { color: '#0A0F1E', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  toggleBtn:  { marginTop: 20, alignItems: 'center' },
  toggleText: { color: '#3A4A6B', fontSize: 13 },
  toggleLink: { color: '#00D4FF', fontWeight: '700' },
  footer:     { color: '#1A2540', fontSize: 11, marginTop: 32 },
  hintText:   { color: '#3A4A6B', fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  errorBox:   { backgroundColor: '#FF4C6A15', borderRadius: 10, borderWidth: 1, borderColor: '#FF4C6A55', padding: 12, marginBottom: 12 },
  errorText:  { color: '#FF4C6A', fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
});