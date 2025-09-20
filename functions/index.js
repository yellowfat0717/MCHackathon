/**
 * Firebase Cloud Functions (v1) + OpenAI
 */
const functions = require("firebase-functions"); // v1 API
const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();

// 👇 在建立 OpenAI client 之前先設定 API Key
process.env.OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || functions.config().openai.key;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Firestore 觸發器：questions 新增 → AI 回答
exports.generateAnswer = functions.firestore
    .document("questions/{questionId}")
    .onCreate(async (snap, context) => {
      const data = snap.data();
      const questionId = context.params.questionId;
      const question = data.text;

      console.log("收到問題:", question);

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "你是一位耐心的家教老師，請分步講解。",
            },
            {role: "user", content: question},
          ],
        });

        const answer = completion.choices[0].message.content;
        console.log("AI 回答:", answer);

        await db.collection("answers").doc(questionId).set({
          question,
          answer,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error("AI 呼叫失敗:", error);

        await db.collection("answers").doc(questionId).set({
          question,
          //answer: "❌ AI 產生失敗：" + (error.message || JSON.stringify(error)),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
