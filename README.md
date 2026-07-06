# Deemcloud AI Chatbot

An intelligent, RAG-powered (Retrieval-Augmented Generation) chatbot built for **Deemcloud**. It uses the cutting-edge **Groq API** and **LLaMA** models to provide instantaneous, accurate answers based on scraped data from the Deemcloud website. It also acts as an automated lead generation tool by booking meetings directly into a MongoDB database.

## 🚀 Features

- **Blazing Fast AI**: Powered by Groq API (LPU inference) for millisecond response times.
- **RAG Architecture**: Scrapes Deemcloud's website and searches the internal knowledge base to ground the AI's answers on true facts.
- **Automated Lead Generation**: Understands when a user wants to "book a meeting", seamlessly collects their Name, Email, Phone, and Time, and saves it.
- **MongoDB Integration**: Uses MongoDB Atlas for secure and persistent storage of both Chat History and Lead Generation Data.
- **Auto-expanding UI**: Dynamic chat input field that supports multi-line inputs with `Shift + Enter`.
- **Smart Auto-Scroll**: Scrolls exactly to the start of the bot's reply so long responses are easy to read.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (via Mongoose)
- **AI/LLM**: Groq API SDK (LLaMA 3)
- **Frontend**: Vanilla HTML/CSS/JS (embeddable via `iframe`)
- **Scraper**: Cheerio for extracting text content from HTML

## 📦 Local Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abdullahbhatti786/chatbot.git
   cd chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   MONGODB_URI=your_mongodb_atlas_connection_string
   ```

4. **Initialize Knowledge Base (Scraper)**
   Before running the server, populate your database with Deemcloud knowledge.
   ```bash
   npm run scrape
   ```

5. **Run the server**
   ```bash
   npm start
   ```

6. **Test the bot**
   Open your browser and navigate to `http://localhost:3000`

## 🌐 Deployment (Render.com)

1. Connect this GitHub repository to Render as a **Web Service**.
2. Set Build Command to: `npm install`
3. Set Start Command to: `npm start`
4. Add `GROQ_API_KEY` and `MONGODB_URI` in Render's Advanced Environment Variables.
5. Deploy!

## 🧑‍💻 Developed By
Developed by **Abdullah Bhatti**.
