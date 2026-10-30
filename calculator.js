// XP needed to go from level n to n+1
function stepXp(n) {
  return Math.floor(100 + 3 * n + 0.5 * n ** 2 + 0.5 * n ** 3);
}

// Total XP required to reach a level (level 1 = 0 XP)
function totalXpForLevel(level) {
  let total = 0;
  for (let n = 1; n < level; n++) total += stepXp(n);
  return total;
}

const fmt = (n) => n.toLocaleString("en-US");

document.getElementById("calcBtn").addEventListener("click", () => {
  const current = parseInt(document.getElementById("currentLevel").value, 10);
  const target = parseInt(document.getElementById("targetLevel").value, 10);
  const xpPerAction = parseFloat(document.getElementById("xpPerAction").value) || 0;
  const out = document.getElementById("result");

  if (!current || !target || current < 1 || target > 200 || target <= current) {
    out.textContent = "Enter valid levels (1-200), with target higher than current.";
    return;
  }

  const xpNeeded = totalXpForLevel(target) - totalXpForLevel(current);
  let html = `<p><strong>XP needed:</strong> ${fmt(xpNeeded)}</p>`;

  if (xpPerAction > 0) {
    html += `<p><strong>Actions needed:</strong> ${fmt(Math.ceil(xpNeeded / xpPerAction))}</p>`;
  }

  out.innerHTML = html;
});
