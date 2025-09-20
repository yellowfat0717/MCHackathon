// scripts/seedAnswers.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseConfig } from "../public/fundamental.js"; // ⚠️ 請依你的實際路徑修改

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/*const firebaseConfig = {
  apiKey: "AIzaSy....",
  authDomain: "mchackathon-36970.firebaseapp.com",
  projectId: "mchackathon-36970",
  storageBucket: "mchackathon-36970.appspot.com",
  messagingSenderId: "132320531275",
  appId: "1:132320531275:web:xxxxxxx",
};*/

// 固定問答資料
const qaList = [
  {
    question: "為什麼二次函數的圖形是拋物線？",
    answer: "二次函數的形式是 y = ax^2 + bx + c。因為最高次項是平方，圖形會對稱並逐漸上升/下降，所以是拋物線，開口方向由 a 的正負決定。",
    video: "https://www.youtube.com/watch?v=kYB8IZa5AuE"
  },
  {
    question: "《師說》中『師者，所以傳道受業解惑也』是什麼意思？",
    answer: "傳道 → 傳授做人處世的道理；受業 → 教導知識；解惑 → 解答疑問。強調老師責任是解惑與教育。",
    video: "https://www.youtube.com/watch?v=O7WlsDZsVfw"
  },
  {
    question: "現在完成式和過去式有什麼不同？",
    answer: "過去式強調過去已完成的動作 (I visited Japan last year)，現在完成式強調到現在的經驗 (I have visited Japan)。",
    video: "https://www.youtube.com/watch?v=rdk38uUwZ_4"
  },
  {
    question: "為什麼電流可以讓燈泡發光？",
    answer: "電流通過鎢絲時因為電阻大產生熱能，當溫度達到2000°C以上鎢絲就會白熾發光。其實是能量轉換的結果。",
    video: "https://www.youtube.com/watch?v=H9O0Wv4D6G8"
  },
  {
    question: "為什麼台灣會有颱風？",
    answer: "台灣位於西北太平洋，夏秋海水溫度高容易生成颱風，加上季風與地形，颱風常登陸台灣。雖有災害，但也帶來水資源。",
    video: "https://www.youtube.com/watch?v=1nn2tFGrTnY"
  }
];

async function seed() {
  for (const qa of qaList) {
    await setDoc(doc(db, "answers", qa.question), {
      ...qa,
      createdAt: serverTimestamp()
    });
    console.log(`✅ Added: ${qa.question}`);
  }
}

seed().then(() => {
  console.log("🎉 All answers seeded!");
});
