// fundamental.js
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import renderContactBook from "./ContactBook.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// ✅ 共用 Firebase 設定（給 login.js 使用）
export const firebaseConfig = {
  apiKey: "AIzaSyBjiZf6SXQpbXtZsWzefNQmh9gQKtIxM4k",
  authDomain: "mchackathon-36970.firebaseapp.com",
  databaseURL: "https://mchackathon-36970-default-rtdb.firebaseio.com",
  projectId: "mchackathon-36970",
  storageBucket: "mchackathon-36970.appspot.com",
  messagingSenderId: "132320531275",
  appId: "1:132320531275:web:c8582e112163670f784ece",
  measurementId: "G-FGQYWXTKE0"
};

// ✅ 登入後顯示功能選擇頁面
export function renderDashboard(container, user, db) {
  container.innerHTML = `<p>✅ 歡迎登入，${user.email}</p>`;

  const features = [
    "錯題分析",
    "自主學習",
    "聯絡簿",
    "報到系統",
    "教師請假"
  ];

  features.forEach((text) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = text;

    if (text === "聯絡簿") {
      btn.onclick = () => {
        container.innerHTML = ""; // 清空畫面
        renderContactBook(container, user); // ✅ 載入聯絡簿功能
      };
    } else {
      btn.onclick = () => alert(`👉 尚未實作：${text}`);
    }

    container.appendChild(btn);
  });
}
