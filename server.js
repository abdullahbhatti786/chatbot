// ============================================
//  Nexus Assistant — Backend Server (Express + Groq)
// ============================================

// --- Step 1: Zaroori packages import karo ---
// dotenv: ye .env file se secret keys load karta hai (jaise GROQ_API_KEY)
// Hamesha sabse pehle dotenv.config() call karo taake baaki code ko env variables mil sakein
require("dotenv").config();

// express: ye humara web server framework hai — routes, requests handle karta hai
const express = require("express");

// cors: ye Cross-Origin Resource Sharing handle karta hai
// Agar frontend alag port pe ho toh bhi backend se baat kar sake
const cors = require("cors");

// path: ye file paths ko sahi tarah se handle karta hai (OS ke hisaab se)
const path = require("path");

// Groq SDK: ye Groq API se baat karne ke liye official package hai
// Groq bohot fast AI inference deta hai (LPU chips use karta hai)
const Groq = require("groq-sdk");

// --- Database module import karo ---
// db.js mein humne SQLite database ka setup kiya hai
// saveMessage: naya message database mein save karta hai
// getConversationHistory: puri conversation ka history nikalta hai
// searchKnowledge: DeemCloud ke baare mein knowledge dhoondta hai
const { connectDB, saveMessage, getConversationHistory, searchKnowledge, saveLead } = require("./db");

// --- Step 2: Express app banao aur port set karo ---
const app = express();
const PORT = process.env.PORT || 3000;
// PORT .env file se aayega, agar nahi mila toh 3000 use hoga

// --- Step 3: Groq client initialize karo ---
// API key .env file se aayegi — kabhi bhi hardcode mat karna!
// Agar key nahi mili toh server start hone pe warning dega
if (!process.env.GROQ_API_KEY) {
  console.warn(
    "⚠️  WARNING: GROQ_API_KEY set nahi hai! .env file mein GROQ_API_KEY=your_key_here likho."
  );
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Step 4: Middlewares lagao ---
// cors(): Ye har request pe CORS headers add karta hai
// Matlab frontend chahe kisi bhi domain se ho, backend se baat kar sakta hai
app.use(cors());

// express.json(): Ye incoming request ki body ko JSON se JavaScript object mein convert karta hai
// Bina iske req.body undefined hoga!
app.use(express.json());

// express.static(): Ye "public" folder ki files directly serve karta hai
// Jaise index.html, style.css, script.js — ye sab bina route banaye serve ho jayengi
app.use(express.static(path.join(__dirname, "public")));

// --- Step 5: System prompt define karo ---
// Ye bot ko batata hai ke uska role kya hai
// Ab bot DeemCloud ke baare mein bhi jaanta hai!
// BASE_SYSTEM_PROMPT: ye hamesha rehta hai
// Knowledge context dynamically add hota hai jab user DeemCloud ke baare mein poochhe
const SYSTEM_PROMPT = `You are Deemcloud AI Assistant, a helpful and friendly AI assistant powered by Deemcloud. 
You are the official AI assistant for DeemCloud (deemcloud.com) — a technology company that provides Cloud Computing, DevOps, AI & Generative AI, AIOps, MLOps, Job Support, Cloud Training, Software Development, Automation, and UI/UX Design services.

Your primary role:
1. Answer questions about DeemCloud's services, company info, and contact details accurately using the knowledge provided to you.
2. When the user asks about DeemCloud, ALWAYS use the provided context to give accurate, detailed answers.
3. You MUST ONLY answer questions related to DeemCloud. If the user asks about ANY general topics (like coding, science, writing, general chat, etc.) that are NOT related to DeemCloud, politely decline and tell them you are only allowed to discuss DeemCloud-related topics. Do NOT provide answers to off-topic questions.
4. Keep responses well-formatted, friendly, and easy to understand.
5. If asked about DeemCloud pricing, refer them to get a free quote at deemcloud.com/get-a-quote or contact info@deemcloud.com.
6. If you don't have specific DeemCloud information to answer a question, suggest they visit deemcloud.com or contact the team.
7. IMPORTANT BOOKING INSTRUCTION: If the user wants to book a meeting or contact DeemCloud, proactively ask for their Name, Email, Phone number, and preferred Meeting Time. Once you have collected ALL FOUR details, you MUST reply with a special hidden tag exactly like this: [BOOK_MEETING: {"name": "...", "email": "...", "phone": "...", "time": "..."}] and then tell the user that their meeting has been booked and our team will contact them shortly.

IMPORTANT: When DeemCloud context is provided below, use it to give accurate answers. Do NOT make up information about DeemCloud.`;

// --- Step 6: Chat endpoint banao ---
// POST /chat — ye frontend se user ka message receive karega
// Aur Groq API se AI ka jawab le ke wapas bhejega
app.post("/chat", async (req, res) => {
  try {
    // req.body se message aur conversationId nikalo
    // Frontend ye bhejta hai: { message: "user ka text", conversationId: "conv_12345" }
    // Agar conversationId nahi mila toh "default" use karo
    const { message, conversationId = "default" } = req.body;

    // Validation: agar message khaali hai ya nahi bheja toh error do
    if (!message || message.trim() === "") {
      return res.status(400).json({
        reply: "Please enter a message.",
        error: "Message field is empty or missing.",
      });
    }

    // --- Step A: User ka message database mein save karo ---
    // Taake baad mein history mein ye message bhi aaye
    await saveMessage(conversationId, "user", message);

    // --- Step B: RAG — Knowledge base se relevant content dhoondho ---
    // User ke message mein se keywords nikaal ke database mein search karo
    // Agar DeemCloud se related kuch mila toh usse context mein add karenge
    const knowledgeResults = await searchKnowledge(message);
    
    // Knowledge context banao — agar kuch mila toh
    let knowledgeContext = "";
    if (knowledgeResults.length > 0) {
      knowledgeContext = `\n\n--- DEEMCLOUD KNOWLEDGE BASE (use this to answer accurately) ---\n`;
      knowledgeResults.forEach((item) => {
        knowledgeContext += `\n[${item.title}] (Source: ${item.source_url})\n${item.content}\n`;
      });
      knowledgeContext += `\n--- END OF KNOWLEDGE BASE ---\n`;
      
      console.log(
        `📚 ${knowledgeResults.length} knowledge entries found for: "${message.substring(0, 50)}..."`
      );
    }

    // --- Step C: Puri conversation history database se nikalo ---
    // Ye sab purane messages return karega (user + assistant dono)
    const history = await getConversationHistory(conversationId);

    // --- Step D: History ko Groq ke format mein convert karo ---
    // Groq ko messages is format mein chahiye:
    //   [{ role: "user"/"assistant", content: "text" }]
    // Database se role aur content already aa raha hai, bas map karo
    const historyMessages = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // --- Step E: Groq API ko call karo (ab knowledge + history ke saath!) ---
    // messages array mein:
    //   1. Pehle system prompt + DeemCloud context (RAG injection!)
    //   2. Phir puri conversation history (purane messages + naya message)
    // Is tarah bot ko pata hota hai DeemCloud ke baare mein + pehle kya baat hui thi
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system", // System message + RAG context
          content: SYSTEM_PROMPT + knowledgeContext,
        },
        ...historyMessages, // Spread operator: puri history yahan aa jayegi
      ],
      model: "llama-3.3-70b-versatile", // Groq pe fast inference wala model
      temperature: 0.7, // Creativity level: 0 = precise, 1 = creative
      max_tokens: 1024, // Maximum kitne words/tokens AI generate kare
    });

    // AI ka response nikalo
    // Response structure: choices[0].message.content mein jawab hota hai
    let reply =
      chatCompletion.choices[0]?.message?.content ||
      "Sorry, I could not generate a response.";

    // --- Step: Check if AI booked a meeting ---
    const bookMeetingRegex = /\[BOOK_MEETING:\s*({[^}]+})\s*\]/;
    const match = reply.match(bookMeetingRegex);
    
    if (match) {
      try {
        const details = JSON.parse(match[1]);
        
        // MongoDB mein save karo
        await saveLead(details.name, details.email, details.phone, details.time);
        
        // Tag ko reply se hata do taake user ko na dikhe
        reply = reply.replace(bookMeetingRegex, "").trim();
      } catch (e) {
        console.error("❌ Failed to parse or save booking details:", e);
      }
    }

    // --- Step F: Bot ka response bhi database mein save karo ---
    // Taake agla message bhejne pe ye reply bhi history mein aaye
    await saveMessage(conversationId, "assistant", reply);

    // Frontend ko jawab bhejo: { reply: "bot ka text" }
    res.json({ reply });
  } catch (error) {
    // Agar kuch bhi galat ho jaye toh error handle karo
    // Console mein full error dikhao (debugging ke liye)
    console.error("❌ Groq API Error:", error.message);

    // Specific error messages depending on kya galat hua
    if (error.status === 401) {
      // 401 = API key galat hai ya expired hai
      return res.status(500).json({
        reply: "API authentication failed. Please check your API key.",
        error: "Invalid or expired GROQ_API_KEY.",
      });
    }

    if (error.status === 429) {
      // 429 = Bohot zyada requests bhej di, rate limit hit ho gaya
      return res.status(429).json({
        reply: "Too many requests. Please wait a moment and try again.",
        error: "Rate limit exceeded.",
      });
    }

    // General error — koi bhi unknown issue
    res.status(500).json({
      reply: "Something went wrong on the server. Please try again later.",
      error: error.message,
    });
  }
});

// --- Step 7: Scrape endpoint (re-scraping ke liye) ---
// POST /scrape — ye endpoint DeemCloud website ko dubara scrape karega
// Taake agar website pe kuch naya aaye toh bot ka knowledge update ho sake
app.post("/scrape", async (req, res) => {
  try {
    const { scrapeAndSave } = require("./scraper");
    await scrapeAndSave();
    res.json({ success: true, message: "DeemCloud knowledge base updated successfully!" });
  } catch (error) {
    console.error("❌ Scrape error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Step 8: MongoDB Connect karo aur Server start karo ---
connectDB().then(() => {
  // Sirf tabhi listen karo jab locally chal raha ho (Vercel khud handle karta hai)
  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log("");
      console.log("🤖 ====================================");
      console.log(`   Nexus Assistant server chal raha hai!`);
      console.log(`   🧠 DeemCloud RAG Knowledge Base Active`);
      console.log(`   🌐 http://localhost:${PORT}`);
      console.log("   ====================================");
      console.log("");
    });
  }
});

// Vercel ke liye app export karna zaroori hai
module.exports = app;
