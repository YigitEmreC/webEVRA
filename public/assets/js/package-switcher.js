// One-click package switcher + "Paketi kaldır", used on the Products page banner,
// the Siparişim summary and the Packages page. Switching keeps the chosen extras;
// removing the package also removes the extras (they can't be bought alone).

import { packages } from "../../data/catalog.js";
import { formatMoney, toCents } from "./pricing.js";
import { getOrder, setPackage, removePackage, extrasCount } from "./cart-store.js";
import { escapeHtml, toast } from "./ui.js";

/** The three packages as selectable options; the current one is marked. */
export function switcherHtml(currentId, { label = "Paketiniz" } = {}) {
  return `
    <div class="pkg-switch" role="group" aria-label="${escapeHtml(label)}">
      ${packages
        .map(
          (p) => `
        <button type="button" class="pkg-option" data-switch-package="${escapeHtml(p.id)}" aria-pressed="${p.id === currentId}">
          <span class="pkg-option-name">${escapeHtml(p.name)}</span>
          <span class="pkg-option-price">${formatMoney(toCents(p.price))}</span>
        </button>`
        )
        .join("")}
    </div>`;
}

export function removeButtonHtml() {
  return `<button type="button" class="btn-remove-pkg" data-remove-package>Paketi kaldır</button>`;
}

/** Handles clicks on switcher options and the remove button inside root. */
export function bindSwitcher(root) {
  root.addEventListener("click", (e) => {
    const option = e.target.closest("[data-switch-package]");
    if (option) {
      const id = option.dataset.switchPackage;
      if (getOrder().package === id) return;
      setPackage(id);
      const name = packages.find((p) => p.id === id)?.name || "";
      toast(`Paketiniz ${name} olarak değiştirildi${extrasCount() ? "; ekstra ürünleriniz korundu" : ""}`);
      return;
    }
    if (e.target.closest("[data-remove-package]")) {
      const n = extrasCount();
      if (n && !confirm(`Paketi kaldırırsanız seçtiğiniz ${n} ekstra ürün de kaldırılır. Devam edilsin mi?`)) return;
      removePackage();
      toast("Paket kaldırıldı", { href: "/packages.html", text: "Paket seç" });
    }
  });
}
