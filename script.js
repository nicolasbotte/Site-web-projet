const CATALOG_URL = "https://e.gheno.fr/data/catalog.full.json";

const fallbackProducts = [
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

let products = [];

const productGrid = document.getElementById("product-grid");
const filterContainer = document.getElementById("filter-container");
const catalogStatus = document.getElementById("catalog-status");
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

function setCatalogStatus(message, tone = "info") {
  if (!catalogStatus) return;
  catalogStatus.textContent = message;
  catalogStatus.dataset.tone = tone;
}

function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((v) => String(v));
  if (typeof value === "string") return value.split(/[,;]\s*/).filter(Boolean);
  return [String(value)];
}

function formatPrice(value) {
  if (typeof value === "number") {
    return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}€ HT`;
  }
  if (!value) return "Tarif sur demande";
  const numeric = Number(String(value).replace(/[^\d.,-]/g, "").replace(",", "."));
  if (!Number.isNaN(numeric)) {
    return `${numeric.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}€ HT`;
  }
  return String(value);
}

function formatLabel(label) {
  return label
    .replace(/[_-]+/g, " ")
    .replace(/\b(fds)\b/i, "FDS")
    .replace(/\bfiche\b/i, "Fiche")
    .replace(/\btechnique\b/i, "technique")
    .trim();
}

function normalizeDownloads(source) {
  const downloads = [];
  const documents =
    source.documents || source.docs || source.downloads || source.files || source.fiches || source.documents_links;

  if (Array.isArray(documents)) {
    documents.forEach((doc, index) => {
      const url = doc?.url || doc?.path || doc?.link || doc?.href;
      const label = doc?.label || doc?.name || doc?.title || `Document ${index + 1}`;
      if (url) {
        downloads.push({ label, path: url });
      }
    });
  } else if (documents && typeof documents === "object") {
    Object.entries(documents).forEach(([key, value]) => {
      if (value) downloads.push({ label: formatLabel(key), path: value });
    });
  }

  const fallbackKeys = [
    "fiche",
    "fiche_technique",
    "ficheTechnique",
    "datasheet",
    "brochure",
    "fds",
    "fiche_securite",
  ];

  fallbackKeys.forEach((key) => {
    if (source[key]) {
      downloads.push({ label: formatLabel(key), path: source[key] });
    }
  });

  return downloads;
}

function normalizeTags(source) {
  const tagCandidates =
    source.tags || source.etiquettes || source.labels || source.usages || source.applications || source.certifications;
  const tags = ensureArray(tagCandidates);
  if (tags.length) return tags;
  const ecoTag = source.ecolabel || source.ecoLabel || source.label || null;
  return ensureArray(ecoTag);
}

function normalizeReviews(rawReviews) {
  if (!rawReviews) return [];
  if (!Array.isArray(rawReviews)) return [];
  return rawReviews
    .map((r, index) => {
      const author = r.author || r.nom || r.name || r.signataire || `Client ${index + 1}`;
      const note = Number(r.note || r.rating || r.score || 5);
      const text = r.text || r.comment || r.avis || r.message || "Retour d'expérience professionnel.";
      return { author, note, text };
    })
    .filter((r) => r.text);
}

function normalizeProduct(raw, index) {
  const source = raw?.fields || raw || {};
  const name =
    source.name || source.nom || source.title || source.libelle || source.libellé || `Produit ${index + 1}`;
  const id = String(source.id || raw.id || source.slug || source.reference || `product-${index}`);
  const category = source.category || source.categorie || source.famille || source.segment || "Autres";
  const description =
    source.description ||
    source.resume ||
    source.detail ||
    source.details ||
    source.desc ||
    "Description en cours de rédaction.";
  const priceValue =
    source.price || source.prix || source.prix_public || source.prix_ht || source.pu_ht || source.price_ht || source.tarif;
  const tags = normalizeTags(source);
  const downloads = normalizeDownloads(source);
  const recommended = ensureArray(
    source.recommande ||
      source.recommandations ||
      source.crossSelling ||
      source.cross_selling ||
      source.recommended ||
      source.associes,
  );
  const reviews = normalizeReviews(source.avis || source.reviews);
  const rating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + (Number(r.note) || 0), 0) / reviews.length
      : Number(source.rating || source.note || 4.8) || 4.8;

  return {
    id,
    name,
    category,
    price: formatPrice(priceValue),
    description,
    tags: tags.length ? tags : ["Référence catalogue"],
    downloads,
    recommended: recommended.length ? recommended : ["Conseil hygiène personnalisé"],
    rating,
    reviews: reviews.length
      ? reviews
      : [
          {
            author: "HygiLog",
            note: Math.round(rating) || 5,
            text: "Demandez un audit hygiène pour optimiser l'usage produit.",
          },
        ],
  };
}

function extractProductList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function fetchCatalog() {
  const response = await fetch(CATALOG_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Requête catalogue échouée (${response.status})`);
  return response.json();
}

function renderFilters() {
  if (!filterContainer) return;
  filterContainer.innerHTML = "";
  if (!products.length) return;

  const categories = ["Tous", ...new Set(products.map((p) => p.category || "Autres"))];
  categories.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${index === 0 ? "active" : ""}`;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(cat === "Tous" ? null : cat);
    });
    filterContainer.appendChild(btn);
  });
}

function renderProducts(category = null) {
  if (!productGrid) return;
  productGrid.innerHTML = "";

  if (!products.length) {
    productGrid.innerHTML = "<p class='empty-state'>Catalogue indisponible pour le moment.</p>";
    return;
  }

  const filtered = category ? products.filter((p) => p.category === category) : products;
  if (!filtered.length) {
    productGrid.innerHTML = "<p class='empty-state'>Aucun produit dans cette catégorie.</p>";
    return;
  }

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
      <div class="tags">${product.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <div class="downloads">
        ${
          product.downloads && product.downloads.length
            ? product.downloads
                .map((d) => `<a class="btn secondary" href="${d.path}" download>${d.label}</a>`)
                .join("")
            : "<span class='muted'>Aucun document disponible</span>"
        }
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
  if (!product || !modal) return;
  selectedProductId = product.id;
  modalTitle.textContent = product.name;
  modalSubtitle.textContent = `${product.category} · ${product.price}`;
  modalDescription.textContent = product.description;
  modalTags.innerHTML = product.tags.map((t) => `<span class="tag">${t}</span>`).join("");
  modalDownloads.innerHTML =
    product.downloads && product.downloads.length
      ? product.downloads.map((d) => `<a class="btn secondary" href="${d.path}" download>${d.label}</a>`).join("")
      : "<span class='muted'>Documents en cours de mise à jour</span>";
  modalReco.textContent = `Cross-selling : ${product.recommended.join(" | ")}`;
  renderReviews(product);
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal?.classList.remove("active");
  modal?.setAttribute("aria-hidden", "true");
  selectedProductId = null;
}

function renderReviews(product) {
  if (!modalRating || !reviewList) return;
  modalRating.textContent = `Note moyenne ${product.rating.toFixed(1)} / 5`;
  reviewList.innerHTML = "";
  product.reviews.forEach((r) => {
    const div = document.createElement("div");
    div.className = "review";
    div.innerHTML = `<strong>${r.author}</strong> · ${"★".repeat(Math.max(1, Math.round(r.note)))}<br>${r.text}`;
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
    const newAverage = product.reviews.reduce((acc, r) => acc + r.note, 0) / product.reviews.length;
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

async function initCatalog() {
  setCatalogStatus("Chargement du catalogue temps réel…", "info");
  try {
    const data = await fetchCatalog();
    const extracted = extractProductList(data).map(normalizeProduct);
    if (!extracted.length) throw new Error("Flux catalogue vide");
    products = extracted;
    setCatalogStatus(`Catalogue mis à jour (${products.length} références).`, "success");
  } catch (error) {
    console.error("Catalogue distant indisponible", error);
    products = fallbackProducts;
    setCatalogStatus(
      "Impossible de joindre le flux catalogue. Affichage d'une sélection type HygiLog.",
      "warning",
    );
  }
  renderFilters();
  renderProducts();
}

initCatalog();
