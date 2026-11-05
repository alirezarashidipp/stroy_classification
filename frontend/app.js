const form = document.querySelector("#classify-form");
const input = document.querySelector("#work-item");
const analyseButton = document.querySelector("#analyse-button");
const clearButton = document.querySelector("#clear-button");
const resultPanel = document.querySelector("#result-panel");
const errorBox = document.querySelector("#error");
let currentResult = null;
let busy = false;

const examples = {
  Story: "As a business banking customer, I want to download my monthly account statement as a PDF so that I can share it with my accountant without visiting a branch.",
  Task: "Update the transaction service's Python dependencies to the approved versions. Regenerate the dependency lock file and document the changes in the release notes.",
  Bug: "After the latest release, the transfer confirmation page shows a blank reference number, although the transfer completes successfully. Expected: display the generated transfer reference. Steps: sign in, make a transfer, and open the confirmation page.",
};

function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function updateInput() {
  const count = input.value.length.toLocaleString("en-GB");
  document.querySelector("#character-count").textContent = `${count} / 12,000`;
  clearButton.disabled = busy || !input.value;
  errorBox.hidden = true;
  if (currentResult) resetResult();
}

function resetResult() {
  currentResult = null;
  resultPanel.classList.remove("has-result");
  document.querySelector("#result-state").textContent = "AWAITING INPUT";
  document.querySelector("#match-score").textContent = "—";
  document.querySelector("#gauge-fill").style.strokeDashoffset = "100";
  document.querySelector("#verdict-label").textContent = "A little clarity, coming up.";
  document.querySelector("#verdict-description").textContent = "Your recommendation and supporting evidence will appear here.";
  for (const selector of ["#review-notice", "#evidence-section", "#result-actions"]) {
    document.querySelector(selector).hidden = true;
  }
  for (const card of document.querySelectorAll(".category-score")) {
    card.classList.remove("selected");
    card.querySelector("strong").textContent = "—";
    card.querySelector(".score-track span").style.width = "0%";
  }
  document.querySelector("#copy-status").textContent = "";
}

function setLoading(loading) {
  busy = loading;
  input.disabled = loading;
  analyseButton.disabled = loading;
  clearButton.disabled = loading || !input.value;
  form.classList.toggle("is-loading", loading);
  resultPanel.setAttribute("aria-busy", String(loading));
  document.querySelector("#analyse-label").textContent = loading ? "Assessing the evidence…" : "Analyse work item";
  document.querySelector("#analyse-icon").textContent = loading ? "◌" : "↗";
  for (const button of document.querySelectorAll("[data-example]")) button.disabled = loading;
  if (loading) {
    document.querySelector("#result-state").textContent = "ANALYSING";
    document.querySelector("#verdict-label").textContent = "Reading between the lines.";
    document.querySelector("#verdict-description").textContent = "Checking your description against the Story, Task and Bug criteria.";
    document.querySelector("#announcement").textContent = "Analysing your work item.";
  }
}

function renderEvidence(result) {
  const list = document.querySelector("#evidence-list");
  list.replaceChildren();
  let selectedCategories = result.categories.filter(category => category.name === result.classification);
  if (!selectedCategories.length) {
    selectedCategories = result.categories.filter(category => category.score === result.match);
  }
  for (const category of selectedCategories) {
    for (const criterion of category.criteria) {
      const row = makeElement("div", undefined, "evidence-row");
      const heading = makeElement("div", undefined, "evidence-row-header");
      let title = criterion.name;
      if (selectedCategories.length > 1) title = `${category.name} · ${title}`;
      heading.append(makeElement("h3", title), makeElement("span", `${criterion.score} / 2`, "criterion-score"));
      row.append(heading);
      if (criterion.evidence) row.append(makeElement("blockquote", criterion.evidence));
      row.append(makeElement("p", criterion.explanation));
      list.append(row);
    }
  }
  const missingList = document.querySelector("#missing-list");
  missingList.replaceChildren();
  for (const item of result.missing_information) missingList.append(makeElement("li", item));
  document.querySelector("#missing-section").hidden = result.missing_information.length === 0;
  document.querySelector("#evidence-section").hidden = false;
}

function renderResult(result) {
  currentResult = result;
  resultPanel.classList.add("has-result");
  document.querySelector("#result-state").textContent = result.needs_review ? "REVIEW SUGGESTED" : "ASSESSMENT READY";
  document.querySelector("#match-score").textContent = result.match;
  document.querySelector("#gauge-fill").style.strokeDashoffset = String(100 - result.match);
  document.querySelector("#verdict-label").textContent = result.classification;
  document.querySelector("#verdict-description").textContent = result.summary;
  document.querySelector("#review-notice").hidden = !result.needs_review;
  for (const category of result.categories) {
    const card = document.querySelector(`[data-category="${category.name}"]`);
    card.classList.toggle("selected", category.name === result.classification);
    card.querySelector("strong").textContent = `${category.score}/100`;
    card.querySelector(".score-track span").style.width = `${category.score}%`;
  }
  renderEvidence(result);
  document.querySelector("#result-actions").hidden = false;
  document.querySelector("#announcement").textContent = `${result.classification}. Rubric match ${result.match} out of 100.${result.needs_review ? " Human review suggested." : ""}`;
}

async function analyseWorkItem(event) {
  event.preventDefault();
  if (busy) return;
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.reportValidity();
    return;
  }
  resetResult();
  errorBox.hidden = true;
  setLoading(true);
  try {
    const response = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(65000),
    });
    const result = await response.json();
    if (!response.ok) {
      const message = typeof result.detail === "string" ? result.detail : "The request could not be processed. Please check your text.";
      throw new Error(message);
    }
    renderResult(result);
  } catch (error) {
    resetResult();
    document.querySelector("#result-state").textContent = "TRY AGAIN";
    let message = error.message;
    if (error.name === "TimeoutError" || error.name === "AbortError") message = "The request took too long. Please try again.";
    if (error instanceof TypeError) message = "Cannot reach the app. Check that the local server is running.";
    errorBox.textContent = message;
    errorBox.hidden = false;
    document.querySelector("#announcement").textContent = "Analysis could not be completed.";
  } finally {
    setLoading(false);
  }
}

async function copyAssessment() {
  if (!currentResult) return;
  const result = currentResult;
  const lines = [result.classification, `Rubric match: ${result.match}/100 (not calibrated confidence)`, result.summary];
  if (result.needs_review) lines.push("Human review suggested.");
  for (const category of result.categories) {
    lines.push(`\n${category.name}: ${category.score}/100`);
    for (const criterion of category.criteria) {
      lines.push(`${criterion.name}: ${criterion.score}/2 — ${criterion.explanation}`);
      if (criterion.evidence) lines.push(`Evidence: “${criterion.evidence}”`);
    }
  }
  if (result.missing_information.length) lines.push("\nHelpful to add:", ...result.missing_information);
  lines.push(`\nProposed demo rubric v${result.rubric_version}`);
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    document.querySelector("#copy-status").textContent = "Copied to clipboard";
  } catch {
    document.querySelector("#copy-status").textContent = "Copy unavailable. Select the result text to copy it.";
  }
}

async function loadRubric() {
  const grid = document.querySelector("#rubric-grid");
  try {
    const response = await fetch("/api/rubric");
    if (!response.ok) throw new Error("Rubric unavailable");
    const rubric = await response.json();
    for (const [name, criteria] of Object.entries(rubric.categories)) {
      const section = makeElement("section", undefined, "rubric-category");
      section.append(makeElement("h3", name));
      const list = makeElement("ol");
      for (const criterion of criteria) {
        const item = makeElement("li");
        item.append(makeElement("strong", criterion.name), makeElement("span", criterion.description));
        list.append(item);
      }
      section.append(list);
      grid.append(section);
    }
  } catch {
    grid.append(makeElement("p", "The rubric could not be loaded. Refresh after checking the local server."));
  }
}

async function checkConfiguration() {
  const label = document.querySelector("#connection-text");
  try {
    const response = await fetch("/api/status");
    if (!response.ok) throw new Error("Status unavailable");
    const status = await response.json();
    label.textContent = status.configured ? "OpenAI configured" : "API key needed";
    document.querySelector("#connection").classList.toggle("configured", status.configured);
  } catch {
    label.textContent = "Server unavailable";
  }
}

form.addEventListener("submit", analyseWorkItem);
input.addEventListener("input", updateInput);
input.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !busy) {
    event.preventDefault();
    form.requestSubmit();
  }
});
clearButton.addEventListener("click", () => {
  input.value = "";
  resetResult();
  updateInput();
  input.focus();
});
for (const button of document.querySelectorAll("[data-example]")) {
  button.addEventListener("click", () => {
    input.value = examples[button.dataset.example];
    updateInput();
    input.focus();
  });
}
document.querySelector("#copy-button").addEventListener("click", copyAssessment);
loadRubric();
checkConfiguration();
