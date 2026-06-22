const questionnaireFieldSelector = [
  "textarea",
  "input[type='text']",
  "input[type='search']",
  "input:not([type])"
].join(",");

const ignoredQuestionnaireTerms = [
  "first name",
  "last name",
  "full name",
  "preferred name",
  "email",
  "phone",
  "linkedin",
  "github",
  "twitter",
  "x",
  "website",
  "portfolio",
  "location",
  "address",
  "city",
  "state",
  "country",
  "postal",
  "zip",
  "school",
  "degree",
  "discipline",
  "gpa",
  "resume"
];

async function fillRequiredQuestionnaireAnswers(profileData) {
  const [syncData, localData] = await Promise.all([
    getStorageDataSync(),
    getStorageDataLocal("Resume_details")
  ]);

  const apiKey = syncData["DeepSeek API Key"];
  if (!apiKey) {
    console.log("Autofill Jobs: DeepSeek API key not found; skipping questionnaire autofill.");
    return;
  }

  const targets = findRequiredQuestionnaireTargets(document);
  if (!targets.length) {
    console.log("Autofill Jobs: No required questionnaire textboxes found.");
    return;
  }

  const questions = targets.map((target) => target.question);
  const resumeDetails = normalizeResumeDetails(localData?.Resume_details);
  const profile = {
    workExperience: resumeDetails?.experiences || []
  };

  const response = await chrome.runtime.sendMessage({
    type: "DEEPSEEK_QUESTIONNAIRE",
    payload: {
      apiKey,
      model: syncData["DeepSeek Model"],
      questions,
      jobDescription: scrapeJobDescription(document),
      customPrompt: syncData["Questionnaire Prompt"],
      profile
    }
  });

  if (!response?.ok) {
    console.error("Autofill Jobs: Questionnaire autofill failed.", response?.error);
    return;
  }

  const answers = response.response?.answers || [];
  if (answers.length !== targets.length) {
    console.error("Autofill Jobs: DeepSeek answer count did not match question count.");
    return;
  }

  targets.forEach((target, index) => {
    if (!answers[index]) return;
    setNativeValue(target.element, answers[index]);
  });

  console.log(`Autofill Jobs: Filled ${targets.length} required questionnaire answers.`);
}

function findRequiredQuestionnaireTargets(root) {
  return Array.from(root.querySelectorAll(questionnaireFieldSelector))
    .filter((element) => isVisible(element))
    .filter((element) => !element.disabled && !element.readOnly)
    .filter((element) => !element.value?.trim())
    .map((element) => ({
      element,
      question: getQuestionText(element)
    }))
    .filter((target) => target.question)
    .filter((target) => isRequiredField(target.element, target.question))
    .filter((target) => !isKnownProfileField(target.element, target.question));
}

function getQuestionText(element) {
  const labelText = getLabelText(element);
  const ariaLabel = element.getAttribute("aria-label");
  const placeholder = element.getAttribute("placeholder");
  const containerText = getClosestQuestionContainerText(element);

  return cleanQuestionText(labelText || ariaLabel || placeholder || containerText);
}

function getLabelText(element) {
  if (element.id) {
    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (label?.textContent) return label.textContent;
  }

  const parentLabel = element.closest("label");
  if (parentLabel?.textContent) return parentLabel.textContent;

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || "")
      .join(" ");
  }

  return "";
}

function getClosestQuestionContainerText(element) {
  const container = element.closest(
    "[data-automation-id*='formField'], .field, .form-field, .application-question, .question, div"
  );
  if (!container) return "";

  return Array.from(container.childNodes)
    .filter((node) => node !== element)
    .map((node) => node.textContent || "")
    .join(" ");
}

function cleanQuestionText(value) {
  return (value || "")
    .replace(/\s+/g, " ")
    .replace(/\b(required|optional)\b/gi, "")
    .replace(/\*/g, "")
    .trim();
}

function isRequiredField(element, question) {
  if (element.required || element.getAttribute("aria-required") === "true") {
    return true;
  }

  const container = element.closest("label, [data-automation-id*='formField'], .field, .form-field, .application-question, .question, div");
  const requiredText = `${question} ${container?.textContent || ""}`.toLowerCase();

  return requiredText.includes("required") || requiredText.includes("*");
}

function isKnownProfileField(element, question) {
  const text = [
    question,
    element.id,
    element.name,
    element.placeholder,
    element.getAttribute("aria-label"),
    element.getAttribute("data-qa"),
    element.getAttribute("data-automation-id")
  ].join(" ").toLowerCase();

  return ignoredQuestionnaireTerms.some((term) => text.includes(term));
}

function scrapeJobDescription(root) {
  const selectors = [
    "[data-automation-id='jobPostingDescription']",
    "[data-qa='job-description']",
    ".job-description",
    ".job__description",
    ".posting-page",
    ".posting",
    "#content",
    "main"
  ];

  for (let selector of selectors) {
    const element = root.querySelector(selector);
    const text = cleanQuestionText(element?.textContent || "");
    if (text.length > 300) return text.slice(0, 12000);
  }

  return cleanQuestionText(root.body?.textContent || "").slice(0, 12000);
}

function normalizeResumeDetails(value) {
  if (!value) return {};
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch (_) {
    return {};
  }
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none";
}
