// calendar.js
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

import { db, renderDashboard } from "./fundamental.js";

// ✅ 取得今天日期
function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// 🔑 清大官方行事曆
const officialEvents = [
  { date: "2025-09-23", title: "行政會議" },
  { date: "2025-10-14", title: "校務會議" },
  { date: "2025-11-18", title: "行政會議" },
  { date: "2025-12-09", title: "校務會議" },
  { date: "2026-01-15", title: "期末考試開始" },
  { date: "2026-01-21", title: "期末考試結束" },
  { date: "2026-01-23", title: "學期成績送交截止" },
  { date: "2026-02-02", title: "學期結束" }
];

// ✅ 初始化：如果 Firestore 是空的 → 自動匯入官方行事曆
async function seedOfficialEvents() {
  const q = query(collection(db, "calendar"));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    for (const ev of officialEvents) {
      await addCalendarEvent(ev.date, ev.title, "official");
    }
    console.log("✅ 官方行事曆已匯入");
  }
}

// ✅ 行事曆主入口
export async function renderCalendar(container, user) {
  container.innerHTML = "";

  // 🏠 回首頁按鈕
  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 回首頁";
  backBtn.className = "btn";
  backBtn.onclick = () => renderDashboard(container, user);
  container.appendChild(backBtn);

  // 讀取角色
  const role = sessionStorage.getItem("role");
  console.log("🔑 行事曆角色:", role);

  if (role === "teacher") {
    await renderTeacherCalendar(container, user);
  } else {
    await renderStudentParentCalendar(container);
  }
}

// 👨‍🏫 老師行事曆
async function renderTeacherCalendar(container, user) {
  await seedOfficialEvents();

  const today = getToday();
  let html = `<h2>📅 重要行事曆</h2><ul>`;

  const q = query(collection(db, "calendar"), orderBy("date"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    html += `<li>目前沒有事件</li>`;
  } else {
    querySnapshot.forEach((docSnap) => {
      const ev = docSnap.data();
      const isToday = ev.date === today;

      // 每個事件項目
      html += `<li style="${isToday ? "color:red;font-weight:bold" : ""}">
        ${ev.date} - ${ev.title} ${isToday ? " ⏰ (今天)" : ""}`;

      // ➖ 刪除按鈕（僅限自訂事件）
      if (ev.source === "custom") {
        html += ` <button class="btn" data-id="${docSnap.id}" data-title="${ev.title}">刪除</button>`;
      }

      html += `</li>`;
    });
  }

  html += `</ul>`;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  container.appendChild(wrapper);

  // 綁定刪除按鈕事件（加上確認）
  wrapper.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");

      // 🔔 確認視窗
      if (!confirm(`確定要刪除「${title}」這個事件嗎？`)) {
        return;
      }

      try {
        await deleteDoc(doc(db, "calendar", id));
        console.log("🗑 已刪除事件:", id);
        renderTeacherCalendar(container, user); // 刷新列表
      } catch (err) {
        alert("❌ 刪除失敗：" + err.message);
      }
    };
  });

  // ➕ 新增表單
  const form = document.createElement("div");
  form.innerHTML = `
    <h3>➕ 新增事件</h3>
    <input type="date" id="eventDate" class="input" />
    <input type="text" id="eventTitle" class="input" placeholder="事件名稱" />
    <button class="btn" id="addEventBtn">新增事件</button>
    <p id="eventResult"></p>
  `;
  container.appendChild(form);

  const addBtn = form.querySelector("#addEventBtn");
  addBtn.onclick = async () => {
    const date = form.querySelector("#eventDate").value;
    const title = form.querySelector("#eventTitle").value.trim();
    const resultEl = form.querySelector("#eventResult");

    if (!date || !title) {
      resultEl.textContent = "❗ 請輸入完整資訊";
      resultEl.style.color = "red";
      return;
    }

    try {
      await addCalendarEvent(date, title, "custom");
      resultEl.textContent = "✅ 新增成功！";
      resultEl.style.color = "green";
      setTimeout(() => renderTeacherCalendar(container, user), 800);
    } catch (err) {
      console.error("❌ 新增事件失敗:", err);
      resultEl.textContent = "❌ 新增失敗：" + err.message;
      resultEl.style.color = "red";
    }
  };
}

// 👨‍👩‍👧 學生／家長行事曆
async function renderStudentParentCalendar(container) {
  await seedOfficialEvents();

  const today = getToday();
  let html = `<h2>📅 重要行事曆</h2><ul>`;

  const q = query(collection(db, "calendar"), orderBy("date"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    html += `<li>目前沒有事件</li>`;
  } else {
    querySnapshot.forEach((docSnap) => {
      const ev = docSnap.data();
      const isToday = ev.date === today;
      html += `<li style="${isToday ? "color:red;font-weight:bold" : ""}">
        ${ev.date} - ${ev.title} ${isToday ? " ⏰ (今天)" : ""}
      </li>`;
    });
  }

  html += `</ul>`;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  container.appendChild(wrapper);
}

// ✅ Firestore 新增事件
export async function addCalendarEvent(date, title, source = "custom") {
  await addDoc(collection(db, "calendar"), {
    date,
    title,
    source, // "official" or "custom"
    createdAt: serverTimestamp()
  });
}
