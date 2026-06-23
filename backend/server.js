// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { cert, initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Firebase Admin Setup ----------
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = getDatabase();

// ---------- Gemini Setup ----------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Agar ek model busy (503) ho to dusra try karenge, isi order mein
// Note: gemini-2.0-flash hata diya - is account mein quota 0 hai (429 error deta hai)
const MODEL_FALLBACK_LIST = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];

// ---------- Helper: LESCO Tariff ke hisaab se bill calculate karo ----------
// Protected (A-1a) aur Unprotected (A-1) slabs, FPA, surcharge, duty, GST sab included
function calculateBill(units) {
  const isProtected = units <= 200; // 200 se kam/equal units = Protected category

  let electricityCharges = 0;

  if (isProtected) {
    // Protected (A-1a) slabs
    if (units <= 100) {
      electricityCharges = units * 10.54;
    } else {
      electricityCharges = 100 * 10.54 + (units - 100) * 12.67;
    }
  } else {
    // Unprotected (A-1) slabs
    const slabs = [
      { upto: 100, rate: 23.59 },
      { upto: 200, rate: 30.10 },
      { upto: 300, rate: 34.26 },
      { upto: 400, rate: 39.15 },
      { upto: 500, rate: 41.36 },
      { upto: 600, rate: 42.78 },
      { upto: 700, rate: 43.92 },
      { upto: Infinity, rate: 48.84 },
    ];

    let remaining = units;
    let lastCap = 0;
    for (const slab of slabs) {
      if (remaining <= 0) break;
      const slabUnits = Math.min(remaining, slab.upto - lastCap);
      electricityCharges += slabUnits * slab.rate;
      remaining -= slabUnits;
      lastCap = slab.upto;
    }
  }

  const fpa = 22.71;
  const fcSurcharge = 35.26;
  const quarterlyAdjustment = 27.04;
  const electricityDuty = electricityCharges * 0.015;
  const gst = electricityCharges * 0.18;
  const incomeTax = 0;

  const totalPayable =
    electricityCharges + fpa + fcSurcharge + quarterlyAdjustment +
    electricityDuty + gst + incomeTax;

  return {
    tariffCategory: isProtected ? 'Protected (A-1a)' : 'Unprotected (A-1)',
    electricityCharges: Number(electricityCharges.toFixed(2)),
    fpa,
    fcSurcharge,
    quarterlyAdjustment,
    electricityDuty: Number(electricityDuty.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    incomeTax,
    totalPayable: Number(totalPayable.toFixed(2)),
  };
}

// ---------- Helper: Fetch electricity data from Firebase ----------
// Data structure: users/{userId}/readings, alerts, alert_history, readings_history
async function fetchElectricityData(userId) {
  const snapshot = await db.ref(`/users/${userId}`).once('value');
  return snapshot.val();
}

// ---------- Helper: Gemini ko retry + fallback models ke sath call karo ----------
async function generateWithRetry(prompt, retriesPerModel = 2) {
  let lastError;

  for (const modelName of MODEL_FALLBACK_LIST) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= retriesPerModel; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        lastError = error;
        const status = error?.status;
        const shouldRetryOrFallback = status === 503 || status === 429;

        if (shouldRetryOrFallback) {
          console.log(`${modelName} unavailable (${status}), attempt ${attempt}/${retriesPerModel}...`);
          if (attempt < retriesPerModel) {
            await new Promise((r) => setTimeout(r, attempt * 1500));
            continue;
          }
          // Is model ke retries khatam, agla model try karenge (loop apne aap aage badhega)
          break;
        }
        throw error; // 503 ke siwa koi aur error - turant upar throw karo
      }
    }
  }

  // Saare models try ho gaye, sab fail hue
  throw lastError;
}

// ---------- Chat Endpoint ----------
app.post('/chat', async (req, res) => {
  try {
    const { message, userId, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 1. Firebase se data lo (sirf is user ka data)
    const electricityData = await fetchElectricityData(userId);

    if (!electricityData) {
      return res.json({ reply: 'Is user ke liye Firebase mein koi data nahi mila.' });
    }

    // 2. Data ko text mein convert karo (Gemini ko context dene ke liye)
    // Agar readings_history bohat bara hai, to sirf recent entries bhejo
    // taake prompt zyada bara na ho jaye.
    const trimmedData = { ...electricityData };
    if (trimmedData.readings_history) {
      const entries = Object.entries(trimmedData.readings_history);
      const recentEntries = entries.slice(-15); // last 15 readings (zyada speed ke liye kam kiya)
      trimmedData.readings_history = Object.fromEntries(recentEntries);
    }

    const dataContext = JSON.stringify(trimmedData, null, 2);

    // 2.6. Bill calculate karo (readings.kwh field se)
    let billContext = '';
    const totalUnits = trimmedData.readings?.kwh ?? null;

    if (typeof totalUnits === 'number') {
      const bill = calculateBill(totalUnits);
      billContext = `
CALCULATED BILL (LESCO Tariff 2026 ke mutabiq, already calculate kiya gaya hai - dobara calculate na karna):
Tariff Category: ${bill.tariffCategory}
Total Units: ${totalUnits} kWh
Electricity Charges: Rs ${bill.electricityCharges}
Fuel Price Adjustment (FPA): Rs ${bill.fpa}
FC Surcharge: Rs ${bill.fcSurcharge}
Quarterly Tariff Adjustment: Rs ${bill.quarterlyAdjustment}
Electricity Duty (1.5%): Rs ${bill.electricityDuty}
General Sales Tax (18%): Rs ${bill.gst}
Income Tax: Rs ${bill.incomeTax}
TOTAL PAYABLE: Rs ${bill.totalPayable}
`;
    }

    // 2.5. Pichli conversation ko text mein convert karo (agar bheji gayi ho)
    let historyText = '';
    if (Array.isArray(history) && history.length > 0) {
      historyText = history
        .map((m) => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.text}`)
        .join('\n');
    }

    // 3. Prompt banao - data + pichli baatcheet + naya sawal
    const prompt = `
Tum ek electricity monitoring assistant ho. Neeche diya gaya data
ek IoT electricity monitoring system se aaya hai (Firebase Realtime Database).

DATA:
${dataContext}
${billContext}

${historyText ? `PICHLI BAATCHEET:\n${historyText}\n` : ''}

USER KA NAYA SAWAL:
${message}

Upar diye gaye data ke hisaab se, user ke sawal ka clear aur seedha
jawab do. Agar "CALCULATED BILL" diya gaya hai, to wahi numbers use karo
- khud se dobara calculate na karna. Agar data mein relevant information
na ho to bata do ke data available nahi hai. Numbers aur units (watts,
kWh, Rs, etc.) ka khaas khayal rakhna.

ZARURI: Hamesha Roman Urdu/Hinglish mein jawab dena (jaise "aapka usage
133 kWh hai" - English letters mein likha hua Urdu/Hindi mix). Kabhi
Devanagari/Hindi script (जैसे यह) use NAHI karna. Casual aur friendly
tone rakhna, bilkul jaise koi dost baat kar raha ho.
`;

    // 4. Gemini ko bhejo (retry logic ke sath, 503 overload handle karne ke liye)
    const aiResponse = await generateWithRetry(prompt);

    // 5. Response wapas bhejo
    res.json({ reply: aiResponse });

  } catch (error) {
    console.error('Error in /chat endpoint:', error);

    const status = error?.status;
    if (status === 503 || status === 429) {
      return res.status(status).json({
        reply: 'AI service abhi thodi busy hai (high demand). Thodi der mein dobara try karein.',
      });
    }

    res.status(500).json({ error: 'Something went wrong', details: error.message });
  }
});

// ---------- Health Check ----------
app.get('/', (req, res) => {
  res.send('Electricity Monitor AI Backend is running ✅');
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});