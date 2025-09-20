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

// 👨‍🏫 老師行事曆
async function renderTeacherCalendar(container, user) {
  await seedOfficialEvents();

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `<h2>📅 重要行事曆</h2><ul id="eventList"></ul>`;
  container.appendChild(wrapper);

  const listEl = wrapper.querySelector("#eventList");

  // 📌 載入清單
  async function loadEvents() {
    listEl.innerHTML = "";
    const today = getToday();

    const q = query(collection(db, "calendar"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      listEl.innerHTML = `<li>目前沒有事件</li>`;
    } else {
      querySnapshot.forEach((docSnap) => {
        const ev = docSnap.data();
        const isToday = ev.date === today;

        const li = document.createElement("li");
        li.style = isToday ? "color:red;font-weight:bold" : "";
        li.textContent = `${ev.date} - ${ev.title}${isToday ? " ⏰ (今天)" : ""}`;

        // ➖ 刪除按鈕（僅限自訂事件）
        if (ev.source === "custom") {
          const delBtn = document.createElement("button");
          delBtn.className = "btn";
          delBtn.textContent = "刪除";
          delBtn.onclick = async () => {
            if (!confirm(`確定要刪除「${ev.title}」嗎？`)) return;
            await deleteDoc(doc(db, "calendar", docSnap.id));
            await loadEvents(); // 🔄 即時刷新
          };
          li.appendChild(delBtn);
        }

        listEl.appendChild(li);
      });
    }
  }

  await loadEvents();

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

      // 清空輸入欄
      form.querySelector("#eventDate").value = "";
      form.querySelector("#eventTitle").value = "";

      await loadEvents(); // 🔄 即時刷新
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
  wrapper.innerHTML = `<h2>📅 重要行事曆</h2><ul id="eventList"></ul>`;
  container.appendChild(wrapper);

  const listEl = wrapper.querySelector("#eventList");
  const today = getToday();

  const q = query(collection(db, "calendar"), orderBy("date"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    listEl.innerHTML = `<li>目前沒有事件</li>`;
  } else {
    querySnapshot.forEach((docSnap) => {
      const ev = docSnap.data();
      const isToday = ev.date === today;

      const li = document.createElement("li");
      li.style = isToday ? "color:red;font-weight:bold" : "";
      li.textContent = `${ev.date} - ${ev.title}${isToday ? " ⏰ (今天)" : ""}`;
      listEl.appendChild(li);
    });
  }
}

// ✅ Firestore 新增事件
export async function addCalendarEvent(date, title, source = "custom") {
  return await addDoc(collection(db, "calendar"), {
    date,
    title,
    source, // "official" or "custom"
    createdAt: serverTimestamp()
  });
}

// 🔔 檢查即將到期的事件（顯示在網站內）
export async function checkUpcomingEvents(days = 3) {
  const today = new Date();
  const targetDate = new Date();
  targetDate.setDate(today.getDate() + days);

  const q = query(collection(db, "calendar"), orderBy("date"));
  const snapshot = await getDocs(q);

  let reminders = [];

  snapshot.forEach((docSnap) => {
    const ev = docSnap.data();
    const evDate = new Date(ev.date);

    if (evDate >= today && evDate <= targetDate) {
      reminders.push(`${ev.date} - ${ev.title} 即將到期！（${days} 天內）`);
    }
  });

  if (reminders.length > 0) {
    showReminderPopup(reminders);
  }
}

// ✅ 在網頁上插入提醒框 (toast)
function showReminderPopup(messages) {
  // 如果已經有提醒框，先移除
  const oldPopup = document.getElementById("reminderPopup");
  if (oldPopup) oldPopup.remove();

  const popup = document.createElement("div");
  popup.id = "reminderPopup";
  popup.style.position = "fixed";
  popup.style.top = "20px";
  popup.style.right = "-400px"; // 從右邊滑入
  popup.style.padding = "15px";
  popup.style.backgroundColor = "#fef3c7";
  popup.style.border = "1px solid #f59e0b";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  popup.style.zIndex = "9999";
  popup.style.color = "#92400e";
  popup.style.fontSize = "1rem";
  popup.style.transition = "right 0.5s ease";

  // 內容
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

  // 滑入效果
  setTimeout(() => {
    popup.style.right = "20px";
  }, 50);

  // 關閉事件
  document.getElementById("closeReminderBtn").onclick = () => {
    popup.remove();
  };

  // ⏳ 自動 10 秒後消失（滑出）
  setTimeout(() => {
    popup.style.right = "-400px";
    setTimeout(() => popup.remove(), 500);
  }, 10000);
}
