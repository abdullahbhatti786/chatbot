require('dotenv').config();
const mongoose = require('mongoose');

// --- Schemas ---

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const knowledgeSchema = new mongoose.Schema({
  sourceUrl: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  scrapedAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  time: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// --- Models ---
const Message = mongoose.model('Message', messageSchema);
const Knowledge = mongoose.model('Knowledge', knowledgeSchema);
const Lead = mongoose.model('Lead', leadSchema);

// --- Connect Function ---
async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI missing in .env file");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Atlas se connect ho gaya!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

// --- DB Operations ---

async function saveMessage(conversationId, role, content) {
  const msg = new Message({ conversationId, role, content });
  await msg.save();
  return { id: msg._id };
}

async function getConversationHistory(conversationId) {
  const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp
  }));
}

async function saveKnowledge(sourceUrl, title, content) {
  const knowledge = new Knowledge({ sourceUrl, title, content });
  await knowledge.save();
  return { id: knowledge._id };
}

async function searchKnowledge(query) {
  const stopWords = ["is", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "what", "how", "who", "where", "when", "why", "can", "do", "does", "did", "will", "would", "could", "should", "are", "was", "were", "been", "be", "have", "has", "had", "i", "you", "we", "they", "he", "she", "it", "me", "my", "your", "about", "tell", "please", "know", "want", "need", "like", "get", "kya", "hai", "ka", "ke", "ki", "ko", "se", "mein", "ye", "wo", "kaise", "kahan", "kab", "kaun", "batao", "bata", "do", "karo"];

  const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));

  if (keywords.length === 0) return [];

  const regexes = keywords.map(kw => new RegExp(kw, 'i'));
  const conditions = regexes.map(regex => ({
    $or: [{ title: regex }, { content: regex }]
  }));

  const results = await Knowledge.find({ $or: conditions }).limit(5);
  return results.map(doc => ({
    source_url: doc.sourceUrl, // Keep exact key mapping for server.js compatibility
    title: doc.title,
    content: doc.content
  }));
}

async function clearKnowledge() {
  await Knowledge.deleteMany({});
  console.log("🗑️  Purana knowledge data delete ho gaya!");
}

async function saveLead(name, email, phone, time) {
  const lead = new Lead({ name, email, phone, time });
  await lead.save();
  console.log("✅ Lead saved to MongoDB!");
  return { id: lead._id };
}

module.exports = {
  connectDB,
  saveMessage,
  getConversationHistory,
  saveKnowledge,
  searchKnowledge,
  clearKnowledge,
  saveLead
};
