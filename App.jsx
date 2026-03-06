import React, { useMemo, useState } from "react";

// MVP PROTOTYPE (single-file)
// What this demonstrates:
// - User intake (goals, diet, allergies, household size, budget)
// - Curated, nutritionist-approved recipes (represented here as a curated catalog)
// - Weekly meal plan generation (simple rules-based matching)
// - Auto-generated grocery list (aggregated ingredients)
// - Export grocery list to CSV

// NOTE: In production, recipes would come from a curated catalog stored in your DB,
// sourced from partners or licensed providers. You are NOT generating recipes from scratch.

const RECIPE_CATALOG = [
  {
    id: "r1",
    title: "High-Protein Chicken Bowl",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=60",
    tags: ["high-protein", "gluten-free", "low-carb"],
    allergens: [],
    estCost: 18,
    ingredients: [
      { name: "chicken breast", qty: 2, unit: "lb" },
      { name: "brown rice", qty: 2, unit: "cup" },
      { name: "broccoli", qty: 2, unit: "head" },
      { name: "olive oil", qty: 2, unit: "tbsp" },
      { name: "garlic", qty: 4, unit: "clove" },
    ],
  },
  {
    id: "r2",
    title: "Salmon + Veg Sheet Pan",
    image:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=60",
    tags: ["heart-healthy", "gluten-free", "keto", "low-carb"],
    allergens: ["fish"],
    estCost: 26,
    ingredients: [
      { name: "salmon", qty: 1.5, unit: "lb" },
      { name: "asparagus", qty: 1, unit: "bunch" },
      { name: "lemon", qty: 2, unit: "each" },
      { name: "olive oil", qty: 2, unit: "tbsp" },
      { name: "black pepper", qty: 1, unit: "tsp" },
    ],
  },
  {
    id: "r3",
    title: "Turkey Chili (Lean)",
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc500f?auto=format&fit=crop&w=600&q=60",
    tags: ["high-protein", "family", "low-sodium"],
    allergens: [],
    estCost: 22,
    ingredients: [
      { name: "ground turkey", qty: 2, unit: "lb" },
      { name: "kidney beans", qty: 2, unit: "can" },
      { name: "diced tomatoes", qty: 2, unit: "can" },
      { name: "onion", qty: 1, unit: "each" },
      { name: "chili powder", qty: 2, unit: "tbsp" },
    ],
  },
  {
    id: "r4",
    title: "Mediterranean Chickpea Salad",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=60",
    tags: ["heart-healthy", "vegetarian"],
    allergens: [],
    estCost: 14,
    ingredients: [
      { name: "chickpeas", qty: 2, unit: "can" },
      { name: "cucumber", qty: 1, unit: "each" },
      { name: "tomatoes", qty: 3, unit: "each" },
      { name: "feta", qty: 6, unit: "oz" },
      { name: "olive oil", qty: 3, unit: "tbsp" },
    ],
  },
  {
    id: "r5",
    title: "Overnight Oats (High Fiber)",
    image:
      "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=600&q=60",
    tags: ["high-fiber", "vegetarian", "paleo"],
    allergens: ["dairy"],
    estCost: 10,
    ingredients: [
      { name: "rolled oats", qty: 2, unit: "cup" },
      { name: "milk or alt milk", qty: 4, unit: "cup" },
      { name: "chia seeds", qty: 4, unit: "tbsp" },
      { name: "berries", qty: 2, unit: "cup" },
      { name: "cinnamon", qty: 1, unit: "tsp" },
    ],
  },
];

const GOALS = [
  { id: "weight-loss", label: "Weight loss" },
  { id: "muscle", label: "Muscle gain" },
  { id: "heart-healthy", label: "Heart healthy" },
  { id: "low-sodium", label: "Low sodium" },
  { id: "high-fiber", label: "High fiber" },
];

const DIETS = [
  { id: "none", label: "No preference" },
  { id: "gluten-free", label: "Gluten free" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "keto", label: "Keto" },
  { id: "low-carb", label: "Low carb" },
  { id: "paleo", label: "Paleo" },
];

const ALLERGENS = [
  { id: "dairy", label: "Dairy" },
  { id: "fish", label: "Fish" },
  { id: "nuts", label: "Tree nuts" },
];

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function toCsv(rows) {
  const header = ["Item", "Quantity", "Unit"].join(",");
  const lines = rows.map((r) => [escapeCsv(r.name), r.qty, escapeCsv(r.unit)].join(","));
  return [header, ...lines].join("\n");
}

function escapeCsv(s) {
  const str = String(s ?? "");
  if (/[\",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const STORES = [
  { id: "instacart", label: "Instacart", mark: "IC" },
  { id: "kroger", label: "Kroger", mark: "KR" },
  { id: "publix", label: "Publix", mark: "PB" },
];

export default function MealPlanToGroceryMVP() {
  const [goals, setGoals] = useState(["heart-healthy"]);
  const [diet, setDiet] = useState("none");
  const [allergens, setAllergens] = useState([]);
  const [householdSize, setHouseholdSize] = useState(2);
  const [weeklyBudget, setWeeklyBudget] = useState(120);
  const [breakfastsPerWeek, setBreakfastsPerWeek] = useState(3);
  const [lunchesPerWeek, setLunchesPerWeek] = useState(3);
  const [dinnersPerWeek, setDinnersPerWeek] = useState(4);
  const [plan, setPlan] = useState([]);
  const [store, setStore] = useState("instacart");
  const [connected, setConnected] = useState(false);
  const [connectorNote, setConnectorNote] = useState("");

  const filteredCatalog = useMemo(() => {
    return RECIPE_CATALOG.filter((r) => {
      // Diet filter
      if (diet !== "none" && !r.tags.includes(diet)) return false;
      // Goal filter (at least one goal tag match if goals selected)
      if (goals.length) {
        const matchesGoal = goals.some((g) => r.tags.includes(g));
        if (!matchesGoal) return false;
      }
      // Allergen exclusion
      if (allergens.length) {
        const hasExcluded = allergens.some((a) => r.allergens.includes(a));
        if (hasExcluded) return false;
      }
      return true;
    });
  }, [diet, goals, allergens]);

  const estimatedPlanCost = useMemo(() => {
    const base = plan.reduce((sum, r) => sum + r.estCost, 0);
    // Very rough scaling factor by household size
    const scale = Math.max(1, householdSize / 2);
    return Math.round(base * scale);
  }, [plan, householdSize]);

  const groceryList = useMemo(() => {
    const map = new Map();
    const scale = Math.max(1, householdSize / 2);

    for (const recipe of plan) {
      for (const ing of recipe.ingredients) {
        const key = `${ing.name}|||${ing.unit}`;
        const prev = map.get(key) || { name: ing.name, unit: ing.unit, qty: 0 };
        prev.qty = Math.round((prev.qty + ing.qty * scale) * 100) / 100;
        map.set(key, prev);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [plan, householdSize]);

  function toggleMulti(setter, values, id) {
    setter(values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);
  }

  function clearDemo() {
    setGoals(["heart-healthy"]);
    setDiet("none");
    setAllergens([]);
    setHouseholdSize(2);
    setWeeklyBudget(120);
    setBreakfastsPerWeek(3);
    setLunchesPerWeek(3);
    setDinnersPerWeek(4);
    setPlan([]);
    setStore("instacart");
    setConnected(false);
    setConnectorNote("");
  }

  function generatePlan() {
    const pool = filteredCatalog.length ? filteredCatalog : RECIPE_CATALOG;

    function buildMeals(count, label) {
      const arr = [];
      for (let i = 0; i < count; i++) {
        const recipe = pool[i % pool.length];
        arr.push({ ...recipe, mealType: label });
      }
      return arr;
    }

    const breakfasts = buildMeals(breakfastsPerWeek, "Breakfast");
    const lunches = buildMeals(lunchesPerWeek, "Lunch");
    const dinners = buildMeals(dinnersPerWeek, "Dinner");

    const combined = [...breakfasts, ...lunches, ...dinners];

    setPlan(combined);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-gray-50 to-white text-gray-900">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h2l2.4 9.5a2 2 0 002 1.5h7.6a2 2 0 002-1.6L21 9H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="20" r="1" fill="white"/>
                <circle cx="18" cy="20" r="1" fill="white"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold">GrocerEase</div>
              <div className="text-xs text-gray-500">Meal planning to grocery list, simplified</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">MVP Demo</span>
            <button
              onClick={clearDemo}
              className="rounded-xl border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7h2l2 9h9l2-6H7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="20" r="1.5" fill="#059669"/>
                <circle cx="18" cy="20" r="1.5" fill="#059669"/>
                <path d="M14 4c-1.5 0-2.5 1.2-2.5 2.5S12.5 9 14 9s2.5-1.2 2.5-2.5S15.5 4 14 4z" fill="#10B981"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold">GrocerEase</h1>
              <div className="text-sm text-gray-500">Nutrition guided meal planning → automatic grocery list</div>
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Intake, a curated nutritionist approved recipe library, a weekly plan, and an automatic grocery list. Not a meal kit and not prepared meals.
          </p>

          {/* Stepper */}
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { n: 1, t: "Intake", d: "Goals, diet, budget" },
              { n: 2, t: "Plan", d: "Weekly meals" },
              { n: 3, t: "Grocery", d: "Auto list" },
              { n: 4, t: "Store", d: "Export or connect" },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                    {s.n}
                  </div>
                  <div className="text-sm font-semibold">{s.t}</div>
                </div>
                <div className="mt-1 text-xs text-gray-600">{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Intake */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Intake</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">Demo ready</span>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium">Goals</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => toggleMulti(setGoals, goals, g.id)}
                    className={classNames(
                      "rounded-full border px-3 py-1 text-sm",
                      goals.includes(g.id) ? "border-emerald-600 bg-emerald-600 text-white" : "bg-white hover:bg-gray-50"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-sm font-medium">Diet</div>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  value={diet}
                  onChange={(e) => setDiet(e.target.value)}
                >
                  {DIETS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="text-sm font-medium">Breakfasts per week</div>
                <input
                  type="number"
                  min={3}
                  max={7}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  value={breakfastsPerWeek}
                  onChange={(e) => setBreakfastsPerWeek(Number(e.target.value || 0))}
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium">Lunches per week</div>
                <input
                  type="number"
                  min={0}
                  max={7}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  value={lunchesPerWeek}
                  onChange={(e) => setLunchesPerWeek(Number(e.target.value || 0))}
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium">Dinners per week</div>
                <input
                  type="number"
                  min={0}
                  max={7}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  value={dinnersPerWeek}
                  onChange={(e) => setDinnersPerWeek(Number(e.target.value || 0))}
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium">Household size</div>
                <input
                  type="number"
                  min={1}
                  max={8}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(Number(e.target.value || 0))}
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium">Weekly budget</div>
                <input
                  type="number"
                  min={30}
                  max={500}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(Number(e.target.value || 0))}
                />
              </label>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium">Allergens to avoid</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALLERGENS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => toggleMulti(setAllergens, allergens, a.id)}
                    className={classNames(
                      "rounded-full border px-3 py-1 text-sm",
                      allergens.includes(a.id) ? "border-emerald-600 bg-emerald-600 text-white" : "bg-white hover:bg-gray-50"
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={clearDemo}
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={generatePlan}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  Generate plan
                </button>
              </div>
              <div className="text-xs text-gray-600">
                Matching recipes: <span className="font-semibold">{filteredCatalog.length}</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Demo catalog only. In production, this is your curated nutritionist approved library.
            </div>
          </div>

          {/* Weekly plan */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Weekly meal plan</h2>
              {plan.length ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Plan ready</span>
              ) : (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">Waiting</span>
              )}
            </div>

            {!plan.length ? (
              <div className="mt-4 rounded-2xl border border-dashed p-5 text-sm text-gray-600">
                Click Generate plan to populate meals and build your grocery list.
              </div>
            ) : (
              <>
                <div className="mt-3 text-sm text-gray-700">
                  Estimated cost: <span className="font-semibold">${estimatedPlanCost}</span>
                  <span className="text-gray-500"> (rough)</span>
                </div>

                <ul className="mt-4 grid gap-3">
                  {plan.map((r, idx) => (
                    <li key={`${r.id}-${idx}`} className="rounded-2xl border p-3 transition-shadow hover:shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                          {r.image ? (
                            <img
                              src={r.image}
                              alt={r.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg text-gray-700">
                              {idx % 3 === 0 ? "🥗" : idx % 3 === 1 ? "🍗" : "🐟"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-semibold">{r.mealType}: {r.title}</div>
                            <div className="shrink-0 text-xs text-gray-600">~${r.estCost}</div>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {r.tags.map((t) => (
                              <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Grocery list */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold">Auto grocery list</h2>
              <div className="mt-1 text-xs text-gray-600">Builds automatically from your weekly plan</div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Store</span>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-700">
                    {STORES.find((s) => s.id === store)?.mark}
                  </div>
                  <select
                    className="rounded-xl border px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    value={store}
                    onChange={(e) => {
                      setStore(e.target.value);
                      setConnected(false);
                      setConnectorNote("");
                    }}
                  >
                    {STORES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  disabled={!groceryList.length}
                  onClick={() => {
                    setConnected(true);
                    if (store === "instacart") {
                      setConnectorNote(
                        "MVP connector: export the list and shop in Instacart. Send to cart requires partner integration."
                      );
                    } else if (store === "kroger") {
                      setConnectorNote(
                        "MVP connector: export the list and shop in Kroger. Cart export requires approved API access."
                      );
                    } else {
                      setConnectorNote(
                        "MVP connector: export the list and shop in Publix. Pickup and delivery flows vary by region and partner."
                      );
                    }
                  }}
                  className={classNames(
                    "rounded-xl px-4 py-2 text-sm font-medium",
                    groceryList.length ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-500"
                  )}
                >
                  {connected ? "Connected" : "Connect"}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={!groceryList.length}
                  onClick={() => downloadText("grocery-list.csv", toCsv(groceryList))}
                  className={classNames(
                    "rounded-xl px-4 py-2 text-sm font-medium",
                    groceryList.length ? "border hover:bg-gray-50" : "bg-gray-200 text-gray-500"
                  )}
                >
                  Export CSV
                </button>
                <button
                  disabled={!groceryList.length}
                  onClick={() => downloadText("grocery-list.txt", groceryList.map((i) => `${i.name}: ${i.qty} ${i.unit}`).join("\n"))}
                  className={classNames(
                    "rounded-xl px-4 py-2 text-sm font-medium",
                    groceryList.length ? "border hover:bg-gray-50" : "bg-gray-200 text-gray-500"
                  )}
                >
                  Export TXT
                </button>
              </div>
            </div>
          </div>

          {connectorNote ? (
            <div className="mt-3 rounded-2xl border bg-emerald-50 p-3 text-xs text-emerald-900">
              {connectorNote}
            </div>
          ) : null}

          {!groceryList.length ? (
            <div className="mt-4 rounded-2xl border border-dashed p-5 text-sm text-gray-600">No items yet.</div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {groceryList.map((i) => (
                    <tr key={`${i.name}-${i.unit}`} className="border-t">
                      <td className="px-3 py-2">{i.name}</td>
                      <td className="px-3 py-2">{i.qty}</td>
                      <td className="px-3 py-2">{i.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* What it is / is not */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-base font-semibold">What GrocerEase is</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Meal planning automation tied to health goals</li>
              <li>Curated nutritionist approved recipe library</li>
              <li>Auto grocery list that you can export</li>
              <li>Designed to plug into existing grocery infrastructure</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-base font-semibold">What GrocerEase is not</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Meal kits</li>
              <li>Prepared meals</li>
              <li>Medical care</li>
              <li>One to one telehealth nutrition appointments</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          Demo tip: run Reset, select Keto or Low carb, set household size to 4, then Generate plan.
        </div>
      </div>
    </div>
  );
}
