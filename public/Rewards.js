// Rewards.js
export function renderRewards(container, user, db) {
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
      </div>
    </div>
  `;
}
