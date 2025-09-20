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
  const displayName =
    sessionStorage.getItem("name") || user.displayName || user.email;
  const role = sessionStorage.getItem("role") || "未設定角色";

  // ✅ Tailwind 美化版 Dashboard
  container.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-start pt-24 px-6">
      <div class="bg-white shadow-lg rounded-xl p-6 w-full max-w-2xl text-center">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">🎉 歡迎登入</h2>
        <p class="text-gray-600 mb-6">👤 ${displayName}（${role}）</p>

        <div id="featureButtons" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- 按鈕會用 JS 動態插入 -->
        </div>
      </div>
    </div>
  `;

  const featureButtons = document.getElementById("featureButtons");

  const features = [
    "線上家教系統",
    "行事曆",
    "聯絡簿",
    "報到系統",
    "教師請假",
    "點數兌換" // ⭐ 新增
  ];

  features.forEach((text) => {
    const btn = document.createElement("button");
    btn.className =
      "w-full bg-indigo-500 text-white font-medium py-3 px-4 rounded-lg shadow hover:bg-indigo-600 transition";
    btn.textContent = text;

    if (text === "聯絡簿") {
      btn.onclick = () => {
        container.innerHTML = "";
        renderContactBook(container, user, db);
      };
    } else if (text === "行事曆") {
      btn.onclick = async () => {
        container.innerHTML = "";
        const { renderCalendar } = await import("./calendar.js");
        renderCalendar(container, user);
      };
    } else if (text === "線上家教系統") {
      btn.onclick = () => {
        container.innerHTML = "";
        renderTutor(container, db, user);
      };
    } else if (text === "點數兌換") {
      btn.onclick = () => {
        // ⭐ 直接顯示商城畫面（Demo 無功能）
        container.innerHTML = `
          <div class="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-200 flex flex-col items-center justify-start pt-24 px-6">
            <div class="bg-white shadow-lg rounded-xl p-6 w-full max-w-2xl text-center">
              <h2 class="text-2xl font-bold text-gray-800 mb-4">🎁 點數商城</h2>
              <p class="text-gray-600 mb-6">👤 ${user.displayName || user.email}</p>
              <p id="pointsDisplay" class="text-xl font-semibold text-yellow-600 mb-6">點數：120</p>

              <div class="space-y-4">
                <div class="flex justify-between items-center border-b pb-2">
                  <span>✏️ 鉛筆 (50 點)</span>
                  <button class="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">兌換</button>
                </div>
                <div class="flex justify-between items-center border-b pb-2">
                  <span>🍬 糖果 (30 點)</span>
                  <button class="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">兌換</button>
                </div>
                <div class="flex justify-between items-center">
                  <span>📓 筆記本 (80 點)</span>
                  <button class="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">兌換</button>
                </div>
              </div>

              <!-- 返回按鈕 -->
              <div class="mt-6">
                <button id="backBtn" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
                  ⬅ 返回功能選單
                </button>
              </div>
            </div>
          </div>
        `;

        // 返回 Dashboard
        const backBtn = document.getElementById("backBtn");
        if (backBtn) {
          backBtn.onclick = () => {
            container.innerHTML = "";
            renderDashboard(container, user);
          };
        }
      };
    } else {
      btn.onclick = () => alert(`👉 尚未實作：${text}`);
    }

    featureButtons.appendChild(btn);
  });
}
