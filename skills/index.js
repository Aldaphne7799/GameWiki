import { mining } from "./mining.js";
import { fishing } from "./fishing.js";

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
  stub("smithing",    "Smithing",    "🔨"),
  stub("woodcutting", "Woodcutting", "🪓"),
  stub("fletching",   "Fletching",   "🏹"),
  stub("crafting",    "Crafting",    "🧵"),
  stub("alchemy",     "Alchemy",     "⚗️"),
  stub("cooking",     "Cooking",     "🍳"),
  stub("firemaking",  "Firemaking",  "🔥"),
  stub("farming",     "Farming",     "🌾"),
];
