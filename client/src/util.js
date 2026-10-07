const SKIP = new Set(["of", "the", "and", "for", "at", "in"]);

// "Computer Lab 2" -> "CL2", "Lecture Theatre 1" -> "LT1", "Main Library" -> "ML"
export function abbreviate(name = "") {
  const words = name.replace(/['’]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
  const letters = words.filter((w) => !/^\d+$/.test(w) && !SKIP.has(w.toLowerCase())).map((w) => w[0].toUpperCase());
  const numbers = words.filter((w) => /^\d+$/.test(w));
  return (letters.slice(0, 4).join("") + numbers.join("")).slice(0, 8) || name.slice(0, 4).toUpperCase();
}

// What students see on a map pin: the admin's code if set, otherwise an automatic short form
export const pinLabel = (v) => v.code || abbreviate(v.name);
