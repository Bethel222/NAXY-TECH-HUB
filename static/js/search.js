document.addEventListener("DOMContentLoaded", () => {
  const searchRoot = document.querySelector("[data-product-search-root]");
  if (!searchRoot) return;

  const input = searchRoot.querySelector("[data-product-search]");
  const emptyState = searchRoot.querySelector("[data-product-search-empty]");
  const cards = Array.from(document.querySelectorAll(".product-card"));
  if (!input || !cards.length) return;

  const normalize = (value) => value.toLowerCase().replace(/\s+/g, " ").trim();
  const getLowestPrice = (card) => {
    const priceText = card.querySelector(".price")?.textContent || "";
    const matches = Array.from(priceText.matchAll(/N\s*([\d,]+)/gi));
    const values = matches
      .map((match) => Number(match[1].replace(/,/g, "")))
      .filter((value) => !Number.isNaN(value));

    if (!values.length) return null;
    return Math.min(...values);
  };

  const updateResults = () => {
    const query = normalize(input.value);
    let visibleCount = 0;

    cards.forEach((card) => {
      const haystack = normalize(card.textContent || "");
      const isMatch = !query || haystack.includes(query);
      card.hidden = !isMatch;
      if (isMatch) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  };

  input.addEventListener("input", updateResults);
  updateResults();
});
