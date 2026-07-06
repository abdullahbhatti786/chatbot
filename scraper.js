// ============================================
//  DeemCloud Website Scraper — Knowledge Base Builder
//  Ye script DeemCloud website ka content database mein save karta hai
//  Taake bot DeemCloud ke baare mein accurately jawab de sake
// ============================================
//
// KYUN HARDCODED DATA?
// DeemCloud ek Next.js (React) website hai — iska content JavaScript se render hota hai
// Simple HTTP request se sirf khaali HTML milti hai, content nahi milta
// Isliye humne pehle se content extract karke yahan likh diya hai
// Agar website update ho toh ye data bhi update karna padega
//
// CHALANE KA TAREEQA:
//   node scraper.js
//   ya
//   npm run scrape

const mongoose = require("mongoose");
const { connectDB, saveKnowledge, clearKnowledge } = require("./db");

// ============================================
//  DeemCloud Website Content (Pre-extracted)
//  Ye sab data deemcloud.com se manually extract kiya gaya hai
// ============================================

const DEEMCLOUD_DATA = [
  // ==========================================
  //  HOME PAGE — Company Overview
  // ==========================================
  {
    url: "https://deemcloud.com",
    title: "DeemCloud — Company Overview",
    content: `DeemCloud is a technology company that empowers businesses with cutting-edge digital solutions. Their tagline is "We Build On-Demand Solutions to Elevate Your Business Online and Accelerate Success."

DeemCloud provides innovative services in Cloud Computing, DevOps, AI & Generative AI, Job Support & Assistance, Cloud Training, AIOps, MLOps, Web and Software Development, Automation, and UI/UX Design.

Key Statistics:
- 100+ satisfied clients worldwide
- 165+ projects completed successfully
- 100% client satisfaction rating
- 24/7 support available

DeemCloud offers a free quote — businesses can visit deemcloud.com/get-a-quote to get started.
They also offer the option to schedule a call for personalized consultation.

Website: https://deemcloud.com
Free Quote: https://deemcloud.com/get-a-quote`,
  },

  // ==========================================
  //  SERVICES — Cloud Computing
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "Cloud Computing Solutions",
    content: `DeemCloud provides Cloud Computing Solutions to optimize your cloud strategy for enhanced scalability, cost savings, and business performance. They leverage cloud technologies to drive innovation, flexibility, and operational efficiency.

Cloud Platforms Supported:
- Amazon Web Services (AWS)
- Microsoft Azure Cloud
- Google Cloud Platform (GCP)

They help businesses migrate to the cloud, optimize existing cloud infrastructure, and implement cloud-native solutions.`,
  },

  // ==========================================
  //  SERVICES — DevOps
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "DevOps Solutions",
    content: `DeemCloud offers DevOps Solutions that streamline your development and operations with cutting-edge DevOps practices for faster and reliable delivery.

Key DevOps Services:
- CI/CD pipelines for seamless automation
- Cloud infrastructure setup and management
- Monitoring, logging, and incident management

They help teams adopt DevOps culture, automate workflows, and improve deployment frequency while maintaining reliability.`,
  },

  // ==========================================
  //  SERVICES — AI & Generative AI
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "Artificial Intelligence & Generative AI",
    content: `DeemCloud creates intelligent systems with AI, machine learning, and generative models to automate tasks, enhance decision-making, and drive innovation.

AI Services Include:
- Development of custom AI models
- Generative AI solutions (like chatbots, content generation, and more)
- AI agents for task automation, customer support, and virtual assistants

They build AI-powered applications that can understand natural language, generate content, analyze data, and make intelligent decisions.`,
  },

  // ==========================================
  //  SERVICES — AIOps & MLOps
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "AIOps & MLOps",
    content: `DeemCloud enhances IT operations with AI-powered insights and streamlines the machine learning lifecycle for optimized performance.

AIOps & MLOps Services:
- AI-powered monitoring, anomaly detection, and predictive analytics
- End-to-end ML pipeline automation and orchestration
- Data preprocessing, versioning, and governance for ML models

They help organizations operationalize their AI/ML initiatives by building robust pipelines and monitoring systems.`,
  },

  // ==========================================
  //  SERVICES — Job Support & Assistance
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "Job Support & Assistance",
    content: `DeemCloud offers personalized job support designed to help professionals excel in their roles by providing expert guidance, solving work-related challenges, and offering continuous learning opportunities.

Job Support Services:
- One-on-one assistance with daily job tasks and project work
- Providing solutions for technical challenges and problem-solving
- Guidance on skill development and career growth

This service is ideal for professionals who need expert backing in their day-to-day work in cloud, DevOps, AI, and related technologies.`,
  },

  // ==========================================
  //  SERVICES — Cloud Training
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "Cloud Training",
    content: `DeemCloud provides comprehensive cloud training to empower teams with the skills and knowledge to leverage cloud technologies effectively and efficiently.

Cloud Training Includes:
- Hands-on training in cloud platforms like AWS, Azure, and Google Cloud
- Cloud architecture design, implementation, and security best practices
- DevOps, containerization (Docker, Kubernetes), and CI/CD pipelines

They offer both individual and corporate training programs for teams looking to upskill in cloud technologies.`,
  },

  // ==========================================
  //  SERVICES — Software Development
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "Software Development",
    content: `DeemCloud crafts high-quality software for mobile, web, and desktop applications, tackling challenges with innovation and precision.

Software Development Services:
- Custom software development for mobile, web, and desktop platforms
- Agile project management and iterative development approach
- UI/UX design, architecture planning, and code optimization

They build modern, scalable applications using the latest technologies and frameworks.`,
  },

  // ==========================================
  //  SERVICES — Automation
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "Automation Solutions",
    content: `DeemCloud provides Automation Solutions to streamline business operations with intelligent automation, eliminating repetitive tasks to boost efficiency and productivity.

Automation Services:
- Business process automation and workflow optimization
- Infrastructure automation and provisioning (Infrastructure as Code)
- Test automation and quality assurance automation

They help businesses automate manual processes, reduce errors, and increase operational efficiency.`,
  },

  // ==========================================
  //  SERVICES — UI/UX Design
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "UI/UX & Graphic Design",
    content: `DeemCloud offers UI/UX and Graphic Design services to craft pixel-perfect, user-centered designs that captivate and deliver seamless digital experiences.

Design Services:
- User interface (UI) design for web and mobile applications
- User experience (UX) research, wireframing, and prototyping
- Brand identity design, visual design, and graphic design

They create intuitive, beautiful interfaces that enhance user engagement and satisfaction.`,
  },

  // ==========================================
  //  ABOUT US — Company Mission & Values
  // ==========================================
  {
    url: "https://deemcloud.com/about-us",
    title: "About DeemCloud — Mission & Vision",
    content: `About DeemCloud — Your Trusted Digital Partner

DeemCloud is trusted by 100+ global clients. Their mission is "Empowering Your Digital Future."

DeemCloud empowers businesses with cutting-edge solutions in Cloud Computing, DevOps, AI & Generative AI, and more. With a focus on innovation and quality, they deliver tailored services to help businesses grow and thrive in the digital era.

Key Achievements:
- 165+ projects completed successfully
- 99.9% cost-effective solutions
- 100+ satisfied clients worldwide
- Enterprise-grade security
- Industry recognition

DeemCloud is built on faith — ensuring trust, timely execution, and a steadfast commitment to your brand.`,
  },

  // ==========================================
  //  ABOUT US — Company Values
  // ==========================================
  {
    url: "https://deemcloud.com/about-us",
    title: "DeemCloud — Core Values",
    content: `DeemCloud's Core Values — What Sets Them Apart:

1. Trust at the Core: DeemCloud is built on faith — ensuring trust, timely execution, and a steadfast commitment to your brand.

2. On-Time Delivery: Punctuality is their promise. They deliver projects efficiently and reliably, meeting every deadline with precision.

3. Tailored Solutions: They reject the one-size-fits-all approach, crafting customized solutions that align perfectly with your brand's unique needs.

4. Continuous Communication: Open communication is at their core. They keep you informed, ensuring their process aligns seamlessly with your vision.

Their values drive everything they do, ensuring excellence in every project.`,
  },

  // ==========================================
  //  CONTACT US — Contact Information
  // ==========================================
  {
    url: "https://deemcloud.com/contact-us",
    title: "Contact DeemCloud",
    content: `How to Contact DeemCloud:

Email: info@deemcloud.com
WhatsApp: +923292928000
Website: https://deemcloud.com/contact-us
Get a Quote: https://deemcloud.com/get-a-quote

USA Office Address:
5900 Balcones Drive, STE 18614
Austin TX, USA 78731

Contact Form Available: You can fill out a contact form on their website with your name, phone, country, email, area of interest, and message.

Areas of Interest they serve:
- Cloud Computing
- DevOps
- AI & Generative AI
- AIOps & MLOps
- Job Support & Assistance
- Cloud Training
- Software Development
- Automation
- UI/UX Design

Response Time: Quick response within 2 hours
Support: 24/7 support available
Guarantee: 100% satisfaction and money-back guarantee
Data Security: 100% data security guaranteed`,
  },

  // ==========================================
  //  CONTACT US — Why Choose DeemCloud
  // ==========================================
  {
    url: "https://deemcloud.com/contact-us",
    title: "Why Choose DeemCloud",
    content: `Why Choose DeemCloud:

1. Quality Assurance: Rigorous testing and quality checks for every project.
2. Fast Delivery: Quick turnaround time with 24/7 support and monitoring.
3. Reliable Solutions: Proven track record with 165+ successful projects.
4. Cost-Effective: Competitive pricing with flexible payment options.
5. Innovation First: Cutting-edge technologies and modern solutions.
6. Clear Communication: Transparent updates and regular project insights.
7. Documentation: Comprehensive documentation and knowledge transfer.

Success Metrics:
- 99.9% Uptime SLA
- 100% Client Satisfaction
- 24/7 Support Available
- 100% Data Security`,
  },

  // ==========================================
  //  SERVICES — CryptoOps (from footer)
  // ==========================================
  {
    url: "https://deemcloud.com/services",
    title: "CryptoOps",
    content: `DeemCloud also offers CryptoOps services, helping businesses with cryptocurrency operations, blockchain infrastructure, and related DevOps practices for crypto/blockchain projects.`,
  },

  // ==========================================
  //  GENERAL — Social Media & Links
  // ==========================================
  {
    url: "https://deemcloud.com",
    title: "DeemCloud — Links & Social Media",
    content: `DeemCloud Online Presence:

Website: https://deemcloud.com
Services: https://deemcloud.com/services
About Us: https://deemcloud.com/about-us
Contact: https://deemcloud.com/contact-us
Get a Quote: https://deemcloud.com/get-a-quote
Privacy Policy: https://deemcloud.com/privacy-policy
Terms & Conditions: https://deemcloud.com/terms-and-conditions

Social Media: DeemCloud is present on Facebook, LinkedIn, and Instagram.
WhatsApp: +923292928000
Email: info@deemcloud.com

DeemCloud's motto: "Empowering businesses with innovative cloud, AI, and digital solutions. Let's build the future together."`,
  },

  // ==========================================
  //  CLIENT REVIEWS — Testimonials
  // ==========================================
  {
    url: "https://deemcloud.com/get-a-quote",
    title: "DeemCloud — Client Reviews & Testimonials",
    content: `What our clients say about DeemCloud (Client Reviews):

1. Client: Baby Sleep Co
Review: "Was very kind, looked into everything before he quoted me to ensure that there was nothing hidden that was going to cost any more. Went above & beyond to help us."

2. Client: Spartacus Bubble Soccer Co Uk
Review: "Muhammad Ahmad did an EXCEPTIONAL job on the project! His professionalism and meticulous attention to detail in the cloud computing domain were impressive, and the comprehensive documentation was top-notch. Working with him was smooth and collaborative thanks to his deep understanding and proactive communication. 🙌"

3. Client: Okyapp Com
Review: "Great job and communication, providing with suggestions and a quick solution."

These reviews showcase DeemCloud's commitment to quality, transparent pricing, and excellent communication in cloud computing and digital solutions.`,
  },
];

// ============================================
//  Main Scraping Function
//  Ye function sab data database mein save karta hai
// ============================================

async function scrapeAndSave() {
  console.log("");
  console.log("🌐 ====================================");
  console.log("   DeemCloud Website Scraper Starting...");
  console.log("   ====================================");
  console.log("");

  try {
    // --- Step 1: Purana data delete karo ---
    // Taake duplicate entries na hon
    console.log("🗑️  Purana knowledge data delete ho raha hai...");
    await clearKnowledge();

    // --- Step 2: Naya data save karo ---
    console.log(`📥 ${DEEMCLOUD_DATA.length} sections save ho rahe hain...\n`);

    for (let i = 0; i < DEEMCLOUD_DATA.length; i++) {
      const item = DEEMCLOUD_DATA[i];
      await saveKnowledge(item.url, item.title, item.content);
      console.log(`  ✅ [${i + 1}/${DEEMCLOUD_DATA.length}] ${item.title}`);
    }

    console.log("");
    console.log("🎉 ====================================");
    console.log("   Scraping complete! Sab data save ho gaya!");
    console.log(`   Total sections: ${DEEMCLOUD_DATA.length}`);
    console.log("   ====================================");
    console.log("");
    console.log("💡 Ab server restart karo aur bot se poochho:");
    console.log('   → "What is DeemCloud?"');
    console.log('   → "What services does DeemCloud offer?"');
    console.log('   → "How to contact DeemCloud?"');
    console.log("");
  } catch (error) {
    console.error("❌ Scraping mein error aaya:", error.message);
    process.exit(1);
  }
}

// --- Agar ye file seedha run ki jaye (node scraper.js) ---
if (require.main === module) {
  connectDB().then(() => {
    scrapeAndSave().then(() => {
      setTimeout(() => {
        mongoose.disconnect();
        process.exit(0);
      }, 1000);
    });
  });
}

module.exports = { scrapeAndSave };
