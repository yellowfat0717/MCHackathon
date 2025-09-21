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

// ✅ 格式化日期（避免時區問題）
function formatDateOnly(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// ✅ 專門解析本地日期（避免時區偏移）
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d); // 本地時間 00:00
}

function getToday() {
  return formatDateOnly(new Date());
}

// ✅ 顯示用格式 yyyy/mm/dd
function formatDisplayDate(dateStr) {
  return dateStr.replace(/-/g, "/"); // 2025-09-21 → 2025/09/21
}

// 🔑 官方行事曆
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

// ✅ 初始化：如果 Firestore 是空的 → 匯入官方行事曆
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

  // 判斷角色
  const role = sessionStorage.getItem("role");
  if (role === "teacher") {
    await renderTeacherCalendar(container, user);
  } else {
    await renderStudentParentCalendar(container);
  }

  // 📢 登入後自動檢查提醒
  checkUpcomingEvents();
}

// 🧑‍🏫 老師行事曆
async function renderTeacherCalendar(container, user) {
  await seedOfficialEvents();

  const wrapper = document.createElement("div");
  wrapper.style.textAlign = "center";
  wrapper.style.marginTop = "20px";
  wrapper.innerHTML = `
    <h2 style="
      font-size:1.8rem;
      font-weight:bold;
      color:#4a4a8a;
      margin-bottom:20px;
      border-bottom:3px solid #d1d1f0;
      display:inline-block;
      padding-bottom:5px;
    ">📅 重要行事曆</h2>
    <ul id="eventList"></ul>
  `;
  container.appendChild(wrapper);

  const listEl = wrapper.querySelector("#eventList");
  listEl.style.listStyle = "none";
  listEl.style.padding = "0";
  listEl.style.display = "flex";
  listEl.style.flexDirection = "column";
  listEl.style.alignItems = "center";
  listEl.style.gap = "12px";

  // 📌 載入清單
  async function loadEvents() {
    listEl.innerHTML = "";
    const todayDate = parseLocalDate(getToday()); // ✅ 用本地日期比較

    const q = query(collection(db, "calendar"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      listEl.innerHTML = `<li>目前沒有事件</li>`;
    } else {
      querySnapshot.forEach((docSnap) => {
        const ev = docSnap.data();
        const source = ev.source || "official"; // 預設官方
        const evDate = parseLocalDate(ev.date);
        const isToday = evDate.getTime() === todayDate.getTime();

        const li = document.createElement("li");
        li.style.cssText = `
          background:#fff;
          padding:12px 18px;
          border-radius:8px;
          box-shadow:0 2px 5px rgba(0,0,0,0.1);
          width:80%;
          max-width:520px;
          text-align:left;
          transition: all 0.3s ease;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:space-between;
        `;

        // hover 效果
        li.onmouseover = () => {
          li.style.transform = "scale(1.03)";
          li.style.background = isToday ? "#ffd6d6" : "#fdfdfd";
          li.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
        };
        li.onmouseout = () => {
          li.style.transform = "scale(1)";
          li.style.background = isToday ? "#ffe5e5" : "#fff";
          li.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
        };

        if (isToday) {
          li.style.background = "#ffe5e5";
          li.style.border = "1px solid #ff4d4f";
          li.style.fontWeight = "bold";
        }

        // 左側內容
        const displayDate = formatDisplayDate(ev.date);
        const contentDiv = document.createElement("div");
        contentDiv.style.display = "flex";
        contentDiv.style.alignItems = "center";
        contentDiv.innerHTML = `
          <span style="font-size:1.1rem;">📅 ${displayDate}</span>
          <span style="margin-left:10px;">${ev.title}${isToday ? " ⏰ (今天)" : ""}</span>
        `;

        // 小圖示 (📘 官方 / ✏️ 自訂)
        const icon = document.createElement("span");
        icon.textContent = source === "official" ? "📘" : "✏️";
        icon.style.marginLeft = "10px";
        contentDiv.appendChild(icon);

        li.appendChild(contentDiv);

        // ➖ 刪除按鈕（僅限自訂事件）
        if (source === "custom") {
          const delBtn = document.createElement("button");
          delBtn.innerHTML = "🗑 刪除";
          delBtn.style.cssText = `
            background:#ff4d4f;
            color:white;
            border:none;
            border-radius:5px;
            padding:5px 10px;
            margin-left:15px;
            cursor:pointer;
            transition:background 0.3s ease;
          `;
          delBtn.onmouseover = () => (delBtn.style.background = "#d9363e");
          delBtn.onmouseout = () => (delBtn.style.background = "#ff4d4f");
          delBtn.onclick = async () => {
            if (!confirm(`確定要刪除「${ev.title}」嗎？`)) return;
            await deleteDoc(doc(db, "calendar", docSnap.id));
            await loadEvents();
          };
          li.appendChild(delBtn);
        }

        listEl.appendChild(li);
      });
    }
  }

  await loadEvents();

  // ➕ 新增事件表單（保持不動）
  const form = document.createElement("div");
  form.style.cssText = `
    margin-top:25px;
    padding:20px;
    border:1px solid #ddd;
    border-radius:12px;
    background:#ffffff;
    text-align:center;
    box-shadow:0 3px 6px rgba(0,0,0,0.1);
    max-width:650px;
    margin-left:auto;
    margin-right:auto;
  `;
  form.innerHTML = `
    <h3 style="margin-bottom:15px;">➕ 新增事件</h3>
    <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
      <input type="date" id="eventDate" class="input" 
             style="padding:8px; border:1px solid #ccc; border-radius:6px;" 
             placeholder="yyyy/mm/dd" />
      <input type="text" id="eventTitle" class="input" placeholder="事件名稱" 
             style="padding:8px; border:1px solid #ccc; border-radius:6px; flex:1; min-width:200px;" />
      <button class="btn" id="addEventBtn" style="
        background:#52c41a;
        color:white;
        border:none;
        border-radius:6px;
        padding:8px 15px;
        cursor:pointer;
        transition:background 0.3s ease;
      ">✅ 新增事件</button>
    </div>
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

      form.querySelector("#eventDate").value = "";
      form.querySelector("#eventTitle").value = "";

      await loadEvents();
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

  const wrapper = document.createElement("div");
  wrapper.style.textAlign = "center";
  wrapper.style.marginTop = "20px";
  wrapper.innerHTML = `
    <h2 style="
      font-size:1.8rem;
      font-weight:bold;
      color:#4a4a8a;
      margin-bottom:20px;
      border-bottom:3px solid #d1d1f0;
      display:inline-block;
      padding-bottom:5px;
    ">📅 重要行事曆</h2>
    <ul id="eventList"></ul>
  `;
  container.appendChild(wrapper);

  const listEl = wrapper.querySelector("#eventList");
  listEl.style.listStyle = "none";
  listEl.style.padding = "0";
  listEl.style.display = "flex";
  listEl.style.flexDirection = "column";
  listEl.style.alignItems = "center";
  listEl.style.gap = "12px";

  const todayDate = parseLocalDate(getToday()); // ✅ 用本地日期比較

  const q = query(collection(db, "calendar"), orderBy("date"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    listEl.innerHTML = `<li>目前沒有事件</li>`;
  } else {
    querySnapshot.forEach((docSnap) => {
      const ev = docSnap.data();
      const source = ev.source || "official";
      const evDate = parseLocalDate(ev.date);
      const isToday = evDate.getTime() === todayDate.getTime();

      const li = document.createElement("li");
      li.style.cssText = `
        background:#fff;
        padding:12px 18px;
        border-radius:8px;
        box-shadow:0 2px 5px rgba(0,0,0,0.1);
        width:80%;
        max-width:520px;
        text-align:left;
        transition: all 0.3s ease;
        cursor:pointer;
        display:flex;
        align-items:center;
      `;

      if (isToday) {
        li.style.background = "#ffe5e5";
        li.style.border = "1px solid #ff4d4f";
        li.style.fontWeight = "bold";
      }

      const displayDate = formatDisplayDate(ev.date);
      li.innerHTML = `
        <span style="font-size:1.1rem;">📅 ${displayDate}</span>
        <span style="margin-left:10px;">${ev.title}${isToday ? " ⏰ (今天)" : ""}</span>
        <span style="margin-left:10px;">${source === "official" ? "📘" : "✏️"}</span>
      `;

      listEl.appendChild(li);
    });
  }
}

// ✅ Firestore 新增事件
export async function addCalendarEvent(date, title, source = "custom") {
  return await addDoc(collection(db, "calendar"), {
    date,
    title,
    source,
    createdAt: serverTimestamp()
  });
}

// 🔔 檢查即將到期的事件
export async function checkUpcomingEvents(days = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date();
  targetDate.setDate(today.getDate() + days);
  targetDate.setHours(23, 59, 59, 999);

  const q = query(collection(db, "calendar"), orderBy("date"));
  const snapshot = await getDocs(q);

  let reminders = [];

  snapshot.forEach((docSnap) => {
    const ev = docSnap.data();
    const evDate = parseLocalDate(ev.date); // ✅ 改成本地日期

    if (evDate >= today && evDate <= targetDate) {
      reminders.push(`${ev.date} - ${ev.title} 即將到期！（${days} 天內）`);
    }
  });

  if (reminders.length > 0) {
    showReminderPopup(reminders);
  }
}

// ✅ 提醒框
function showReminderPopup(messages) {
  const oldPopup = document.getElementById("reminderPopup");
  if (oldPopup) oldPopup.remove();

  const popup = document.createElement("div");
  popup.id = "reminderPopup";
  popup.style.position = "fixed";
  popup.style.top = "20px";
  popup.style.right = "-400px";
  popup.style.padding = "15px";
  popup.style.backgroundColor = "#fef3c7";
  popup.style.border = "1px solid #f59e0b";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  popup.style.zIndex = "9999";
  popup.style.color = "#92400e";
  popup.style.fontSize = "1rem";
  popup.style.transition = "right 0.5s ease";

  popup.innerHTML = `
    <strong>📅 行事曆提醒</strong>
    <ul style="margin-top:8px; padding-left:20px;">
      ${messages.map((m) => `<li>${m}</li>`).join("")}
    </ul>
    <button id="closeReminderBtn" style="
      margin-top:10px;
      padding:5px 10px;
      background:#f59e0b;
      color:white;
      border:none;
      border-radius:5px;
      cursor:pointer;
    ">關閉</button>
  `;

  document.body.appendChild(popup);

  setTimeout(() => { popup.style.right = "20px"; }, 50);
  document.getElementById("closeReminderBtn").onclick = () => { popup.remove(); };
  setTimeout(() => {
    popup.style.right = "-400px";
    setTimeout(() => popup.remove(), 500);
  }, 10000);
}
