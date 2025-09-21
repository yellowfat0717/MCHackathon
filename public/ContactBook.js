// ContactBook.js
import { doc, setDoc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { renderDashboard } from "./fundamental.js";

// ✅ 主入口
export default async function renderContactBook(container, user, db) {
  container.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div class="max-w-4xl mx-auto">
        <button id="backBtn" class="mb-6 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition">🏠 回首頁</button>
        <div id="contactBookWrapper"></div>
      </div>
    </div>
  `;

  document.getElementById("backBtn").onclick = () => renderDashboard(container, user);

  const role = sessionStorage.getItem("role");
  const wrapper = document.getElementById("contactBookWrapper");

  if (role === "teacher") {
    renderTeacherView(wrapper, user, db);
  } else {
    renderStudentParentView(wrapper, db);
  }
}

// 👨‍🏫 教師畫面
async function renderTeacherView(container, user, db) {
  container.innerHTML = `
    <div class="bg-white shadow-lg rounded-xl p-6 mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">👨‍🏫 教師聯絡簿管理</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-gray-600 mb-1">日期</label>
          <input type="date" id="dateInput" value="${new Date().toISOString().split("T")[0]}"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"/>
        </div>
        <div id="itemContainer" class="space-y-2"></div>
        <button id="addItemBtn" class="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">➕ 新增事項</button>
        <button id="submitBtn" class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">📤 儲存</button>
        <p id="result" class="mt-2 text-sm"></p>
      </div>
    </div>

    <div class="bg-white shadow-lg rounded-xl p-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-4">📅 歷史紀錄</h3>
      <select id="historySelect" class="mb-4 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"></select>
      <div id="historyContent" class="space-y-3"></div>
    </div>
  `;

  const itemContainer = document.getElementById("itemContainer");

  function addItemField(value = "", done = false) {
    const div = document.createElement("div");
    div.className = "flex items-center space-x-2";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none";
    input.placeholder = "輸入事項";
    input.value = value;

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = done;

    div.appendChild(input);
    div.appendChild(chk);
    itemContainer.appendChild(div);
  }

  // 預設一個輸入框
  addItemField();

  document.getElementById("addItemBtn").onclick = () => addItemField();

  document.getElementById("submitBtn").onclick = async () => {
    const date = document.getElementById("dateInput").value;
    const items = [...itemContainer.querySelectorAll("div")].map(div => {
      const input = div.querySelector("input[type=text]");
      const chk = div.querySelector("input[type=checkbox]");
      return { text: input.value.trim(), done: chk.checked };
    }).filter(i => i.text);

    if (items.length === 0) return alert("❗請至少輸入一個事項");

    try {
      // ✅ 先到 users 集合抓老師名字
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let teacherName = "未知教師";
      if (userDoc.exists()) {
        const userData = userDoc.data();
        teacherName = userData.name || (user.email ? user.email.split("@")[0] : "未知教師");
      }

      await setDoc(doc(db, "contactBooks", date), {
        date,
        teacherName,
        items
      });

      const result = document.getElementById("result");
      result.textContent = `✅ ${date} 聯絡簿已儲存`;
      result.className = "mt-2 text-green-600 font-medium";
      loadHistory(); // 儲存後更新歷史紀錄
    } catch (err) {
      const result = document.getElementById("result");
      result.textContent = "❌ 儲存失敗：" + err.message;
      result.className = "mt-2 text-red-600 font-medium";
    }
  };

  // 📜 歷史紀錄
  async function loadHistory() {
    const snapshot = await getDocs(collection(db, "contactBooks"));
    const dates = snapshot.docs.map(doc => doc.id).sort().reverse();

    const select = document.getElementById("historySelect");
    const contentDiv = document.getElementById("historyContent");
    select.innerHTML = "";
    contentDiv.innerHTML = "";

    if (dates.length === 0) {
      contentDiv.innerHTML = `<p class="text-gray-500">⚠️ 尚無歷史紀錄。</p>`;
      return;
    }

    dates.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      select.appendChild(opt);
    });

    async function showHistory(date) {
      const docRef = doc(db, "contactBooks", date);
      const docSnap = await getDoc(docRef);
      contentDiv.innerHTML = "";

      if (docSnap.exists()) {
        const data = docSnap.data();

        const list = document.createElement("ul");
        list.className = "space-y-2";

        data.items.forEach(item => {
          const li = document.createElement("li");
          li.className = "px-4 py-2 bg-gray-50 rounded-lg flex justify-between";
          li.textContent = item.text + (item.done ? " ✅" : "");
          list.appendChild(li);
        });

        contentDiv.appendChild(list);

        // 👉 載入到編輯區
        const loadBtn = document.createElement("button");
        loadBtn.textContent = "✏ 載入到編輯區";
        loadBtn.className = "mt-3 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600";
        loadBtn.onclick = () => {
          document.getElementById("dateInput").value = data.date;
          itemContainer.innerHTML = "";
          data.items.forEach(it => addItemField(it.text, it.done));
        };
        contentDiv.appendChild(loadBtn);
      } else {
        contentDiv.innerHTML = `<p class="text-red-500">⚠️ 此日期無資料。</p>`;
      }
    }

    showHistory(select.value);
    select.onchange = () => showHistory(select.value);
  }

  loadHistory();
}

// 👨‍👩‍👧 學生／家長畫面
async function renderStudentParentView(container, db) {
  container.innerHTML = `
    <div class="bg-white shadow-lg rounded-xl p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">📘 聯絡簿內容</h2>
      <select id="dateSelect" class="mb-4 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"></select>
      <div id="contactContent"></div>
    </div>
  `;

  const snapshot = await getDocs(collection(db, "contactBooks"));
  const dates = snapshot.docs.map(doc => doc.id).sort().reverse();
  const select = document.getElementById("dateSelect");
  const contentDiv = document.getElementById("contactContent");

  if (dates.length === 0) {
    contentDiv.innerHTML = `<p class="text-gray-500">⚠️ 目前尚無聯絡簿內容。</p>`;
    return;
  }

  dates.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  });

  async function loadContactBook(date) {
    const docRef = doc(db, "contactBooks", date);
    const docSnap = await getDoc(docRef);

    contentDiv.innerHTML = "";
    if (docSnap.exists()) {
      const data = docSnap.data();

      const info = document.createElement("div");
      info.className = "mb-4 text-gray-700";
      info.innerHTML = `
        <p><strong>日期：</strong>${data.date}</p>
        <p><strong>教師：</strong>${data.teacherName}</p> <!-- ✅ 顯示 Firestore users 裡的 name -->
      `;
      contentDiv.appendChild(info);

      const list = document.createElement("ul");
      list.className = "space-y-3";

      data.items.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg";

        const text = document.createElement("span");
        text.textContent = item.text;
        if (item.done) {
          text.className = "line-through text-green-600";
        }
        li.appendChild(text);

        if (!item.done) {
          const btn = document.createElement("button");
          btn.className = "bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm";
          btn.textContent = "✔ 標記完成";
          btn.onclick = async () => {
            try {
              const updatedItems = [...data.items];
              updatedItems[idx].done = true;
              await setDoc(docRef, { ...data, items: updatedItems });
              loadContactBook(date);
            } catch (err) {
              alert("❌ 更新失敗：" + err.message);
            }
          };
          li.appendChild(btn);
        } else {
          const doneLabel = document.createElement("span");
          doneLabel.className = "text-green-600 font-medium";
          doneLabel.textContent = "✅ 已完成";
          li.appendChild(doneLabel);
        }

        list.appendChild(li);
      });

      contentDiv.appendChild(list);
    } else {
      contentDiv.innerHTML = `<p class="text-red-500">⚠️ 此日期無聯絡簿內容。</p>`;
    }
  }

  loadContactBook(select.value);
  select.onchange = () => loadContactBook(select.value);
}
