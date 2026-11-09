import { mining } from "./mining.js";
import { fishing } from "./fishing.js";
import { woodcutting } from "./woodcutting.js";
import { firemaking } from "./firemaking.js";
import { fletching } from "./fletching.js";
import { crafting } from "./crafting.js";
import { alchemy } from "./alchemy.js";
import { farming } from "./farming.js";
const stub = (id, name, icon) => ({
  id,
  name,
  icon,
  active: false,
  taskTitle: "Coming soon",
  renderTask(container) {
    container.innerHTML = `<p class="note">${name} isn't available yet.</p>`;
  },
  onLevelChange() {},
  calculate() {
    return `<p class="note">${name} isn't available yet.</p>`;
  },
});

export const SKILLS = [
  mining,
  fishing,
  woodcutting,
  firemaking,
  fletching,
  crafting,
  alchemy,
  farming,
  stub("smithing",    "Smithing",    "🔨"),
  stub("cooking",     "Cooking",     "🍳"),
];
