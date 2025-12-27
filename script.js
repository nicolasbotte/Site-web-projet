const products = [
  {
    id: "surface-pro",
    name: "Surface Pro FoodSafe",
    category: "Cuisine professionnelle",
    price: "24,90€ HT",
    description:
      "Dégraissant alcalin contact alimentaire, prêt à l'emploi, idéal cuisines collectives et restauration rapide.",
    tags: ["HACCP", "Contact alimentaire", "Prêt à l'emploi"],
    downloads: [
      { label: "Fiche technique", path: "assets/docs/fiche-technique-surface-pro.pdf" },
      { label: "FDS", path: "assets/docs/fiche-donnees-securite-surface-pro.pdf" },
    ],
    recommended: ["SmartMix Station", "Microfibres Codées", "Gants nitrile"],
    rating: 4.8,
    reviews: [
      { author: "Chef de prod", note: 5, text: "Pouvoir dégraissant + contact alimentaire, parfait pour nos audits." },
      { author: "Responsable QHSE", note: 4, text: "Clair, fiches téléchargeables directement pour les équipes." },
    ],
  },
  {
    id: "desisafe",
    name: "DésiSafe Spectre+",
    category: "Santé & Bloc opératoire",
    price: "32,50€ HT",
    description:
      "Désinfectant virucide EN14476, large spectre bactéricide, temps de contact 60s pour surfaces sensibles.",
    tags: ["EN14476", "Sans rinçage", "Spectre large"],
    downloads: [
      { label: "Fiche technique", path: "assets/docs/fiche-technique-desisafe.pdf" },
      { label: "FDS", path: "assets/docs/fiche-donnees-securite-desisafe.pdf" },
    ],
    recommended: ["Lingettes ReadyDose", "Gants nitrile", "Aspirateur HEPA"],
    rating: 4.9,
    reviews: [
      { author: "Cadre de santé", note: 5, text: "Temps de contact ultra court, pratique pour les rotations de salle." },
      { author: "Infirmier hygiéniste", note: 5, text: "Documentation claire, dilution maîtrisée." },
    ],
  },
  {
    id: "autolaveuse",
    name: "Autolaveuse Glide 50",
    category: "Facility management",
    price: "4 990€ HT",
    description:
      "Autolaveuse compacte batteries Li-Ion, connectée, tableau de bord usage & coûts par site.",
    tags: ["Connectée", "Batterie Li-Ion", "Reporting"],
    downloads: [
      { label: "Notice", path: "assets/docs/notice-autolaveuse-glide.pdf" },
      { label: "FDS batteries", path: "assets/docs/fds-batterie-glide.pdf" },
    ],
    recommended: ["Disques haute productivité", "Détergent pH Control", "Station de charge"],
    rating: 4.7,
    reviews: [
      { author: "Responsable site", note: 5, text: "Tableau de bord précieux pour nos audits clients." },
      { author: "Prestataire FM", note: 4, text: "Format compact parfait pour les couloirs étroits." },
    ],
  },
];

const productGrid = document.getElementById("product-grid");
const filterContainer = document.getElementById("filter-container");
const modal = document.getElementById("product-modal");
const modalTitle = document.getElementById("modal-title");
const modalSubtitle = document.getElementById("modal-subtitle");
const modalDescription = document.getElementById("modal-description");
const modalTags = document.getElementById("modal-tags");
const modalDownloads = document.getElementById("modal-downloads");
const modalReco = document.getElementById("modal-reco");
const modalRating = document.getElementById("modal-rating");
const reviewList = document.getElementById("review-list");
const reviewForm = document.getElementById("review-form");
let selectedProductId = null;

function renderFilters() {
  const categories = ["Tous", ...new Set(products.map((p) => p.category))];
  categories.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${index === 0 ? "active" : ""}`;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(cat === "Tous" ? null : cat);
    });
    filterContainer.appendChild(btn);
  });
}

function renderProducts(category = null) {
  productGrid.innerHTML = "";
  const filtered = category
    ? products.filter((p) => p.category === category)
    : products;

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "card product-card";
    card.innerHTML = `
      <div class="product-header">
        <div>
          <h3>${product.name}</h3>
          <p style="margin:0;color:var(--grey);">${product.category}</p>
        </div>
        <div class="price">${product.price}</div>
      </div>
      <p>${product.description}</p>
      <div class="tags">${product.tags
        .map((t) => `<span class="tag">${t}</span>`)
        .join("")}</div>
      <div class="downloads">
        ${product.downloads
          .map(
            (d) => `<a class="btn secondary" href="${d.path}" download>${d.label}</a>`
          )
          .join("")}
      </div>
      <div class="reco">Recommandations : ${product.recommended.join(" · ")}</div>
      <div class="actions">
        <button class="btn" onclick="openProduct('${product.id}')">Voir détail & avis</button>
        <button class="btn secondary">Ajouter au panier</button>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

function openProduct(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  selectedProductId = product.id;
  modalTitle.textContent = product.name;
  modalSubtitle.textContent = `${product.category} · ${product.price}`;
  modalDescription.textContent = product.description;
  modalTags.innerHTML = product.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  modalDownloads.innerHTML = product.downloads
    .map((d) => `<a class="btn secondary" href="${d.path}" download>${d.label}</a>`)
    .join("");
  modalReco.textContent = `Cross-selling : ${product.recommended.join(" | ")}`;
  renderReviews(product);
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  selectedProductId = null;
}

function renderReviews(product) {
  modalRating.textContent = `Note moyenne ${product.rating.toFixed(1)} / 5`;
  reviewList.innerHTML = "";
  product.reviews.forEach((r) => {
    const div = document.createElement("div");
    div.className = "review";
    div.innerHTML = `<strong>${r.author}</strong> · ${"★".repeat(r.note)}<br>${r.text}`;
    reviewList.appendChild(div);
  });
}

if (reviewForm) {
  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(reviewForm);
    const name = formData.get("name");
    const rating = Number(formData.get("rating"));
    const comment = formData.get("comment");
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    product.reviews.unshift({ author: name, note: rating, text: comment });
    const newAverage =
      product.reviews.reduce((acc, r) => acc + r.note, 0) / product.reviews.length;
    product.rating = newAverage;
    reviewForm.reset();
    renderReviews(product);
  });
}

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

renderFilters();
renderProducts();
