// fundamental.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import renderContactBook from "./ContactBook.js";
import renderTutor from "./Tutor.js";

// ✅ Firebase 設定
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

// ✅ 初始化 Firebase（只做一次）
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ✅ 登入後顯示功能選單
export function renderDashboard(container, user) {
  // 👉 從 sessionStorage 拿名字和角色
  const displayName = sessionStorage.getItem("name") || user.displayName || user.email;
  const role = sessionStorage.getItem("role") || "未設定角色";

  // 顯示使用者資訊
  container.innerHTML = `<p>✅ 歡迎登入，${displayName}（${role}）</p>`;

  const features = [
    "線上家教系統",
    "行事曆",
    "聯絡簿",
    "報到系統",
    "教師請假",
  ];

  features.forEach((text) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = text;

    if (text === "聯絡簿") {
      btn.onclick = () => {
        container.innerHTML = ""; // 清空畫面
        renderContactBook(container, user, db); // ✅ 把 db 傳進去
      };
    } else if (text === "行事曆") {
      btn.onclick = async () => {
        container.innerHTML = "";
        // 🔑 動態載入 calendar.js
        const { renderCalendar } = await import("./calendar.js");
        renderCalendar(container, user);
      };
    } else if (text === "線上家教系統") {
      btn.onclick = () => {
        container.innerHTML = "";
        renderTutor(container, db, user); // ✅ 呼叫家教系統
      };
    } else {
      btn.onclick = () => alert(`👉 尚未實作：${text}`);
    }

    container.appendChild(btn);
  });
}
