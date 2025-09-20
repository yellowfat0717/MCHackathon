// ContactBook.js
import { doc, setDoc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { renderDashboard } from "./fundamental.js";

// ✅ 主入口
export default async function renderContactBook(container, user, db) {
  container.innerHTML = "";

  // 回首頁按鈕
  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 回首頁";
  backBtn.className = "btn";
  backBtn.onclick = () => renderDashboard(container, user);
  container.appendChild(backBtn);

  const role = sessionStorage.getItem("role");

  if (role === "teacher") {
    renderTeacherView(container, user, db);
  } else {
    renderStudentParentView(container, db);
  }
}

// 👨‍🏫 教師畫面
function renderTeacherView(container, user, db) {
  const wrapper = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = "👨‍🏫 教師聯絡簿填寫";
  wrapper.appendChild(title);

  // 日期選擇
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.value = new Date().toISOString().split("T")[0];
  wrapper.appendChild(dateInput);

  // 事項容器
  const itemContainer = document.createElement("div");
  wrapper.appendChild(itemContainer);

  // 新增一個事項欄位
  function addItemField(value = "") {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "input";
    input.placeholder = "輸入事項";
    input.value = value;
    itemContainer.appendChild(input);
  }

  // 預設一個輸入框
  addItemField();

  // 新增事項按鈕
  const addItemBtn = document.createElement("button");
  addItemBtn.textContent = "➕ 新增事項";
  addItemBtn.className = "btn";
  addItemBtn.onclick = () => addItemField();
  wrapper.appendChild(addItemBtn);

  // 送出按鈕
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "📤 送出";
  submitBtn.className = "btn";
  wrapper.appendChild(submitBtn);

  const result = document.createElement("p");
  wrapper.appendChild(result);

  // 送出事件
  submitBtn.onclick = async () => {
    const date = dateInput.value;
    const items = [...itemContainer.querySelectorAll("input")]
      .map(i => i.value.trim())
      .filter(v => v)
      .map(text => ({ text, done: false })); // 每個事項預設未完成

    if (items.length === 0) return alert("❗請至少輸入一個事項");

    try {
      await setDoc(doc(db, "contactBooks", date), {
        date,
        teacherEmail: user.email,
        items
      });
      result.textContent = `✅ ${date} 聯絡簿已儲存`;
      result.style.color = "green";
    } catch (err) {
      result.textContent = "❌ 儲存失敗：" + err.message;
      result.style.color = "red";
    }
  };

  container.appendChild(wrapper);
}

// 👨‍👩‍👧 學生／家長畫面
async function renderStudentParentView(container, db) {
  const wrapper = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = "📘 聯絡簿內容";
  wrapper.appendChild(title);

  // 抓所有日期
  const snapshot = await getDocs(collection(db, "contactBooks"));
  const dates = snapshot.docs.map(doc => doc.id).sort().reverse();

  if (dates.length === 0) {
    wrapper.appendChild(document.createTextNode("⚠️ 目前尚無聯絡簿內容。"));
    container.appendChild(wrapper);
    return;
  }

  // 日期選單
  const select = document.createElement("select");
  dates.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  });
  wrapper.appendChild(select);

  // 顯示區域
  const contentDiv = document.createElement("div");
  wrapper.appendChild(contentDiv);

  async function loadContactBook(date) {
    const docRef = doc(db, "contactBooks", date);
    const docSnap = await getDoc(docRef);

    contentDiv.innerHTML = "";
    if (docSnap.exists()) {
      const data = docSnap.data();

      // 顯示基本資訊
      const info = document.createElement("p");
      info.innerHTML = `<strong>日期：</strong>${data.date}<br>
                        <strong>教師：</strong>${data.teacherEmail}`;
      contentDiv.appendChild(info);

      // 顯示事項清單
      const list = document.createElement("ul");
      data.items.forEach((item, idx) => {
        const li = document.createElement("li");

        const text = document.createElement("span");
        text.textContent = item.text;
        if (item.done) {
          text.style.textDecoration = "line-through";
          text.style.color = "green";
        }
        li.appendChild(text);

        // 完成按鈕
        if (!item.done) {
          const btn = document.createElement("button");
          btn.className = "btn";
          btn.textContent = "✔ 標記完成";
          btn.onclick = async () => {
            try {
              const updatedItems = [...data.items];
              updatedItems[idx].done = true; // 標記完成
              await setDoc(docRef, { ...data, items: updatedItems });
              loadContactBook(date); // 重新載入
            } catch (err) {
              alert("❌ 更新失敗：" + err.message);
            }
          };
          li.appendChild(btn);
        } else {
          const doneLabel = document.createElement("span");
          doneLabel.textContent = " ✅ 已完成";
          li.appendChild(doneLabel);
        }

        list.appendChild(li);
      });
      contentDiv.appendChild(list);

    } else {
      contentDiv.textContent = "⚠️ 此日期無聯絡簿內容。";
    }
  }

  // 預設載入第一個日期
  loadContactBook(select.value);
  select.onchange = () => loadContactBook(select.value);

  container.appendChild(wrapper);
}

