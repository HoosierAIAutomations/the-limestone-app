/**
 * smartCTA.js
 * Returns the most useful action button for a directory listing based on
 * its category, subcategory, name, website, and phone availability.
 *
 * Returns: { label, icon, url, action }
 *   action: 'url' | 'phone' | 'none'
 */

// Known chain brands that have dedicated ordering apps / URLs
const CHAIN_ORDER_URLS = {
  "mcdonald":     "https://www.mcdonalds.com",
  "taco bell":    "https://www.tacobell.com",
  "subway":       "https://www.subway.com",
  "pizza hut":    "https://www.pizzahut.com",
  "starbucks":    "https://www.starbucks.com",
  "arby":         "https://www.arbys.com",
  "culver":       "https://www.culvers.com",
  "captain d":    "https://captainds.com",
  "bob evans":    "https://www.bobevans.com",
  "denny":        "https://www.dennys.com",
  "dairy queen":  "https://www.dairyqueen.com",
  "burger king":  "https://www.bk.com",
  "domino":       "https://www.dominos.com",
  "golden corral":"https://www.goldencorral.com",
  "wendy":        "https://www.wendys.com",
  "chick-fil":    "https://www.chick-fil-a.com",
  "panera":       "https://www.panerabread.com",
  "chipotle":     "https://www.chipotle.com",
  "sonic":        "https://www.sonicdrivein.com",
  "hardee":       "https://www.hardees.com",
  "popeye":       "https://www.popeyes.com",
  "kfc":          "https://www.kfc.com",
  "papa john":    "https://www.papajohns.com",
};

// Chains known to have apps — label says "Order on App"
const APP_CHAINS = [
  "mcdonald", "taco bell", "subway", "starbucks", "chick-fil",
  "chipotle", "panera", "domino", "pizza hut", "sonic", "wendy",
  "arby", "culver", "burger king", "dairy queen", "popeye",
];

const FOOD_SUBCATS_ORDERING = [
  "Fast Food", "Pizza Shop", "Coffee & Cafe", "Bakery & Cafe",
  "Ice Cream & Sweets", "BBQ & Steakhouse", "Brewery & Pub",
];

const FOOD_SUBCATS_MENU = [
  "Asian Cuisine", "Mexican Cuisine", "Sit-Down Diners",
  "Buffet", "Groceries & Markets",
];

export function getSmartCTA(item) {
  const nameLower = (item.name || "").toLowerCase();
  const categoryId = item.categoryId || "";
  const subCategory = item.subCategory || "";
  const hasWebsite = item.website && item.website !== "N/A" && item.website.startsWith("http");
  const hasPhone = item.phone && item.phone !== "N/A";

  // ── FOOD & DRINK ──────────────────────────────────────────────────────────
  if (categoryId === "food_drink") {
    // 1. Known chain with a dedicated app
    const appChain = APP_CHAINS.find((k) => nameLower.includes(k));
    if (appChain) {
      const orderUrl = CHAIN_ORDER_URLS[appChain] || item.website;
      return {
        label: "Order on App",
        icon: "phone-portrait-outline",
        url: orderUrl || item.website,
        action: "url",
      };
    }

    // 2. Known chain with ordering website (not necessarily app-first)
    const chainKey = Object.keys(CHAIN_ORDER_URLS).find((k) => nameLower.includes(k));
    if (chainKey) {
      return {
        label: "Order Now",
        icon: "cart-outline",
        url: CHAIN_ORDER_URLS[chainKey],
        action: "url",
      };
    }

    // 3. Fast-food / pizza sub-category with website → "Order Now"
    if (FOOD_SUBCATS_ORDERING.includes(subCategory) && hasWebsite) {
      return {
        label: "Order Now",
        icon: "cart-outline",
        url: item.website,
        action: "url",
      };
    }

    // 4. Groceries sub-category → "Shop Groceries"
    if (subCategory === "Groceries & Markets" && hasWebsite) {
      return {
        label: "Shop Groceries",
        icon: "basket-outline",
        url: item.website,
        action: "url",
      };
    }

    // 5. Sit-down / buffet with website → "View Menu"
    if (FOOD_SUBCATS_MENU.filter(c => c !== "Groceries & Markets").includes(subCategory) && hasWebsite) {
      return {
        label: "View Menu",
        icon: "restaurant-outline",
        url: item.website,
        action: "url",
      };
    }

    // 5. Any food place with a website → "View Menu / Order"
    if (hasWebsite) {
      return {
        label: "View Menu",
        icon: "restaurant-outline",
        url: item.website,
        action: "url",
      };
    }

    // 6. No website but has phone → "Call to Order"
    if (hasPhone) {
      return {
        label: "Call to Order",
        icon: "call-outline",
        url: item.phone,
        action: "phone",
      };
    }

    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── AUTO & TRANSPORT ──────────────────────────────────────────────────────
  if (categoryId === "auto_transport") {
    if (subCategory === "Public Transit") {
      if (hasWebsite) {
        return { label: "Book a Ride", icon: "bus-outline", url: item.website, action: "url" };
      }
      if (hasPhone) {
        return { label: "Call to Book", icon: "call-outline", url: item.phone, action: "phone" };
      }
    }
    if (subCategory === "Dealerships") {
      if (hasWebsite) {
        return { label: "Browse Inventory", icon: "car-outline", url: item.website, action: "url" };
      }
    }
    if (subCategory === "EV Stations") {
      if (hasWebsite) {
        return { label: "View Chargers", icon: "flash-outline", url: item.website, action: "url" };
      }
    }
    if (subCategory === "Auto Repair & Body" || subCategory === "Towing & Heavy Haul") {
      if (hasWebsite) {
        return { label: "Schedule Service", icon: "construct-outline", url: item.website, action: "url" };
      }
      if (hasPhone) {
        return { label: "Call to Schedule", icon: "call-outline", url: item.phone, action: "phone" };
      }
    }
    if (hasWebsite) {
      return { label: "Visit / Book", icon: "globe-outline", url: item.website, action: "url" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── HEALTH & WELLNESS ─────────────────────────────────────────────────────
  if (categoryId === "health_wellness") {
    if (hasWebsite) {
      return { label: "Schedule Appt.", icon: "calendar-outline", url: item.website, action: "url" };
    }
    if (hasPhone) {
      return { label: "Call to Schedule", icon: "call-outline", url: item.phone, action: "phone" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── REAL ESTATE & HOUSING ─────────────────────────────────────────────────
  if (categoryId === "real_estate_housing") {
    if (hasWebsite) {
      return { label: "Browse Listings", icon: "home-outline", url: item.website, action: "url" };
    }
    if (hasPhone) {
      return { label: "Call Agent", icon: "call-outline", url: item.phone, action: "phone" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── PROFESSIONAL SERVICES ─────────────────────────────────────────────────
  if (categoryId === "professional_services") {
    if (subCategory === "Banks & Credit Unions") {
      if (hasWebsite) return { label: "Online Banking", icon: "card-outline", url: item.website, action: "url" };
    }
    if (subCategory === "Funeral Services") {
      if (hasWebsite) return { label: "View Services", icon: "ribbon-outline", url: item.website, action: "url" };
      if (hasPhone) return { label: "Call Now", icon: "call-outline", url: item.phone, action: "phone" };
    }
    if (hasWebsite) {
      return { label: "Visit / Apply", icon: "globe-outline", url: item.website, action: "url" };
    }
    if (hasPhone) {
      return { label: "Call Office", icon: "call-outline", url: item.phone, action: "phone" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── HOME & TRADES ─────────────────────────────────────────────────────────
  if (categoryId === "home_trades") {
    if (hasWebsite) {
      return { label: "Get a Quote", icon: "hammer-outline", url: item.website, action: "url" };
    }
    if (hasPhone) {
      return { label: "Call for Quote", icon: "call-outline", url: item.phone, action: "phone" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── RETAIL & BOUTIQUES ────────────────────────────────────────────────────
  if (categoryId === "retail_boutiques") {
    if (hasWebsite) {
      return { label: "Shop Now", icon: "bag-handle-outline", url: item.website, action: "url" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── EDUCATION & CHILDCARE ─────────────────────────────────────────────────
  if (categoryId === "education_childcare") {
    if (hasWebsite) {
      return { label: "View / Enroll", icon: "school-outline", url: item.website, action: "url" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── AGRICULTURE & FARMING ─────────────────────────────────────────────────
  if (categoryId === "agriculture_farming") {
    if (hasWebsite) {
      return { label: "Visit Stand", icon: "leaf-outline", url: item.website, action: "url" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── PET CARE ──────────────────────────────────────────────────────────────
  if (categoryId === "pet_care") {
    if (hasWebsite) {
      return { label: "Book Appt.", icon: "paw-outline", url: item.website, action: "url" };
    }
    if (hasPhone) {
      return { label: "Call to Book", icon: "call-outline", url: item.phone, action: "phone" };
    }
    return { label: null, icon: null, url: null, action: "none" };
  }

  // ── DEFAULT FALLBACK ───────────────────────────────────────────────────────
  if (hasWebsite) {
    return { label: "Visit / Book", icon: "globe-outline", url: item.website, action: "url" };
  }
  return { label: null, icon: null, url: null, action: "none" };
}
