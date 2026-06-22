/*
import {
  keyDownEvent,
  keyUpEvent,
  mouseUpEvent,
  changeEvent,
  inputEvent,
  sleep,
  curDateStr,
  scrollToTop,
  base64ToArrayBuffer,
  monthToNumber,
  getTimeElapsed,
  delays,
  getStorageDataLocal,
  getStorageDataSync,
  setNativeValue,
  fields
} from "./utils";
import { workDayAutofill } from './workday';
*/

let initTime;
window.addEventListener("load", (_) => {
  console.log("AutofillJobs: found job page.");
  initTime = new Date().getTime();
});
const applicationFormQuery = "#application-form, #application_form, #applicationform";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "AUTOFILL_JOBS_FILL") return false;

  manualAutofill()
    .then((result) => sendResponse(result))
    .catch((error) => {
      console.error("Autofill Jobs: Manual autofill failed.", error);
      sendResponse({ ok: false, error: error?.message || "Autofill failed." });
    });

  return true;
});

function getActiveJobForm() {
  if (window.location.hostname.includes("workday")) return null;

  return document.querySelector(applicationFormQuery) ||
    document.querySelector("form, #mainContent");
}

async function manualAutofill() {
  initTime = new Date().getTime();

  let isSupported = false;
  for (let jobForm in fields) {
    if (window.location.hostname.includes(jobForm)) {
      isSupported = true;
      break;
    }
  }

  if (!isSupported) {
    return { ok: false, error: "This page is not a supported job application." };
  }

  const form = getActiveJobForm();
  if (!window.location.hostname.includes("workday") && !form) {
    return { ok: false, error: "No application form found on this page." };
  }

  await autofill(form);
  return { ok: true };
}


function inputQuery(jobParam, form) {
  return inputQueryWithAliases(jobParam, form, []);
}

function inputQueryWithAliases(jobParam, form, aliases = []) {
  const normalizedParams = [jobParam, ...getDefaultAliasesForParam(jobParam), ...aliases]
    .filter(Boolean)
    .map((param) => param.toLowerCase().trim());

  let inputElement = Array.from(form.querySelectorAll("input")).find(
    (input) => {
      if (normalizedParams.some((param) => ["name", "full name", "preferred name"].includes(param)) && isFirstOrLastNameInput(input)) {
        return false;
      }

      const labelText = getInputLabelText(input)?.toLowerCase().trim();
      if (isSensitiveYesNoQuestion(cleanQuestionText(labelText))) {
        return false;
      }

      const attributes = [
        input.id?.toLowerCase().trim(),
        input.name?.toLowerCase().trim(),
        input.placeholder?.toLowerCase().trim(),
        input.getAttribute("aria-label")?.toLowerCase().trim(),
        input.getAttribute("aria-labelledby")?.toLowerCase().trim(),
        input.getAttribute("aria-describedby")?.toLowerCase().trim(),
        input.getAttribute("data-qa")?.toLowerCase().trim(),
        labelText,
      ];

      for (let i = 0; i < attributes.length; i++) {
        if (
          attributes[i] != undefined &&
          normalizedParams.some((param) => attributeMatchesFieldParam(attributes[i], param))
        ) {
          return true;
        }
      }
      return false;
    }
  );
  return inputElement;
}

function isFirstOrLastNameInput(input) {
  const text = [
    input.id,
    input.name,
    input.placeholder,
    input.getAttribute("aria-label"),
    input.getAttribute("data-qa"),
    getInputLabelText(input),
  ].join(" ").toLowerCase();

  return /\b(first|last)\s*name\b/.test(text) || /first_name|last_name/.test(text);
}

function strictInputQuery(jobParam, form) {
  const normalizedParam = jobParam.toLowerCase().trim();

  return Array.from(form.querySelectorAll("input")).find((input) => {
    const attributes = [
      input.id?.toLowerCase().trim(),
      input.name?.toLowerCase().trim(),
      input.getAttribute("data-qa")?.toLowerCase().trim(),
    ].filter(Boolean);

    return attributes.some((attribute) => attribute === normalizedParam || attribute.endsWith(`[${normalizedParam}]`));
  });
}

function getInputLabelText(input) {
  const labels = [];
  const directLabelText = getDirectInputLabelText(input);
  if (directLabelText) labels.push(directLabelText);

  const container = input.closest("[data-automation-id*='formField'], .field, .form-field, .application-question, .question");
  if (container?.textContent) labels.push(container.textContent);

  return labels.join(" ");
}

function getDirectInputLabelText(input) {
  const labels = [];
  if (input.id) {
    const directLabel = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
    if (directLabel?.textContent) labels.push(directLabel.textContent);
  }

  const wrappingLabel = input.closest("label");
  if (wrappingLabel?.textContent) labels.push(wrappingLabel.textContent);

  return labels.join(" ");
}

function getDefaultAliasesForParam(jobParam) {
  const normalizedParam = jobParam.toLowerCase();
  if (normalizedParam.includes("linkedin") || normalizedParam.includes("linked in")) {
    return ["linkedin", "linked in", "linkedin profile", "linkedin url", "linkedin profile url"];
  }
  if (normalizedParam.includes("github") || normalizedParam.includes("git hub")) {
    return ["github", "git hub", "github profile", "github url", "github profile url"];
  }
  return [];
}

function mappingCategoryForParam(param) {
  if (param === "Full Name") return "name";
  if (param === "Email") return "email";
  if (param === "Phone") return "phone";
  return null;
}

async function getCustomFieldMappings() {
  const localData = await getStorageDataLocal();
  return localData.fieldMappings || {};
}

function formatCityStateCountry(data, param) {
  let formattedStr = `${data[param] != undefined ? `${data[param]},` : ""} ${
    data["Location (State/Region)"] != undefined
      ? `${data["Location (State/Region)"]},`
      : ""
  }`;
  if (formattedStr[formattedStr.length - 1] == ",")
    formattedStr = formattedStr.slice(0, formattedStr.length - 1);
  return formattedStr;
}

function getInputQuestionText(input) {
  return getDirectInputLabelText(input)
    .replace(/\s+/g, " ")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase();
}

function findGreenhouseQuestionInput(form, labels) {
  const normalizedLabels = labels.map((label) => label.toLowerCase());

  return Array.from(form.querySelectorAll("input")).find((input) => {
    if (input.type === "hidden" || input.type === "file") return false;
    const text = getInputQuestionText(input);
    if (!text) return false;
    if (isSensitiveYesNoQuestion(text)) return false;

    return normalizedLabels.some((label) => text === label || text.includes(label));
  });
}

function cleanQuestionText(value) {
  return (value || "")
    .replace(/\s+/g, " ")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase();
}

function findQuestionContainer(form, match) {
  return Array.from(form.querySelectorAll("fieldset, .field, .form-field, .application-question, .question, [data-qa*='question'], [data-automation-id*='formField']"))
    .find((container) => match(cleanQuestionText(container.textContent || "")));
}

function closestMatchingContainer(control, root, match) {
  let container = control.parentElement;
  while (container && container !== root && container !== document.body) {
    const text = cleanQuestionText(container.textContent || "");
    if (match(text)) return container;
    container = container.parentElement;
  }
  return null;
}

function isSensitiveYesNoQuestion(text) {
  return (text.includes("legally authorized") && text.includes("work")) ||
    text.includes("sponsor") ||
    text.includes("sponsorship");
}

function attributeMatchesFieldParam(attribute, param) {
  if (!attribute || !param) return false;
  if (attribute === param) return true;

  if (param === "state") {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(param)}([^a-z0-9]|$)`).test(attribute);
  }

  return attribute.includes(param);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesQuestionLabel(text, labels) {
  return labels.some((label) => {
    const normalizedLabel = cleanQuestionText(label);
    return text === normalizedLabel ||
      text.startsWith(`${normalizedLabel} `) ||
      text.startsWith(`${normalizedLabel}:`) ||
      text.startsWith(`${normalizedLabel}?`);
  });
}

function legalAuthorizationAnswer(data) {
  return "Yes";
}

function sponsorshipAnswer(data) {
  return data["Requires Sponsorship"] ? "Yes" : "No";
}

function optionText(option) {
  const label = option.id ? document.querySelector(`label[for="${CSS.escape(option.id)}"]`) : null;
  return cleanQuestionText([
    option.value,
    option.textContent,
    option.getAttribute("aria-label"),
    label?.textContent,
    option.closest("label")?.textContent,
  ].filter(Boolean).join(" "));
}

function elementOwnText(element) {
  return cleanQuestionText(Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent || "")
    .join(" "));
}

function matchesDesiredOptionText(text, desired) {
  const normalizedText = cleanQuestionText(text);
  return normalizedText === desired || normalizedText.split(/\s+/).includes(desired);
}

function isVisibleElement(element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function clickElement(element) {
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  element.dispatchEvent(mouseUpEvent);
  element.click();
}

function findVisibleMatchingOption(desiredValue) {
  const desired = cleanQuestionText(desiredValue);
  return Array.from(document.querySelectorAll("[role='option'], [id*='react-select'][id*='option'], li, div"))
    .find((item) => {
      if (!isVisibleElement(item)) return false;
      const ownText = elementOwnText(item);
      const ariaText = item.getAttribute("aria-label") || "";
      const fullText = cleanQuestionText(item.textContent || "");
      const isOptionElement = item.getAttribute("role") === "option" ||
        item.matches("[id*='react-select'][id*='option'], li");

      if (isOptionElement) {
        return matchesDesiredOptionText(ownText || ariaText || fullText, desired);
      }

      return ownText === desired || cleanQuestionText(ariaText) === desired || fullText === desired;
    });
}

function chooseMatchingOption(container, desiredValue) {
  if (!container || !desiredValue) return false;
  const desired = cleanQuestionText(desiredValue);

  const select = container.querySelector("select");
  if (select) {
    const option = Array.from(select.options).find((item) => {
      const text = cleanQuestionText(`${item.value} ${item.textContent}`);
      return text === desired || text.includes(desired);
    });
    if (!option) return false;
    select.value = option.value;
    select.dispatchEvent(changeEvent);
    select.dispatchEvent(inputEvent);
    return true;
  }

  const choice = Array.from(container.querySelectorAll("input[type='radio'], input[type='checkbox'], [role='radio'], [role='option'], button"))
    .find((item) => {
      const text = optionText(item);
      return matchesDesiredOptionText(text, desired);
    });

  if (!choice) return false;
  choice.click();
  return true;
}

function clickMatchingChoiceIn(root, desiredValue) {
  if (!root || !desiredValue) return false;
  const desired = cleanQuestionText(desiredValue);

  const select = root.querySelector?.("select");
  if (select) return chooseMatchingOption(root, desiredValue);

  const choice = Array.from(root.querySelectorAll?.("label, button, input[type='radio'], input[type='checkbox'], [role='radio'], [role='option']") || [])
    .find((item) => {
      const text = optionText(item) || elementOwnText(item);
      return matchesDesiredOptionText(text, desired);
    });

  if (!choice) return false;
  choice.click();
  return true;
}

async function clickGreenhouseComboboxOption(container, desiredValue) {
  if (!container || !desiredValue) return false;

  const input = container.querySelector("input[role='combobox'], input[aria-expanded], input[aria-autocomplete], input[id*='question']");
  if (!input) return false;

  setNativeValue(input, "");
  const control = input.closest("[role='combobox'], [class*='select__control'], [class*='select-control']") || input;
  clickElement(control);
  input.focus();
  await sleep(delays.short);

  let option = findVisibleMatchingOption(desiredValue);
  if (!option) {
    setNativeValue(input, desiredValue);
    input.dispatchEvent(inputEvent);
    await sleep(delays.short);
    option = findVisibleMatchingOption(desiredValue);
  }

  if (!option) return false;
  clickElement(option);
  await sleep(delays.short);
  return true;
}

function chooseMatchingOptionNearQuestion(form, match, desiredValue) {
  if (!desiredValue) return false;
  const desired = cleanQuestionText(desiredValue);

  const selects = Array.from(form.querySelectorAll("select"));
  for (const select of selects) {
    const container = closestMatchingContainer(select, form, match);
    if (!container) continue;

    if (chooseMatchingOption(container, desiredValue)) return true;
  }

  const controls = Array.from(form.querySelectorAll("input[type='radio'], input[type='checkbox'], [role='radio'], [role='option'], button"));
  const control = controls.find((item) => {
    const text = optionText(item);
    if (!matchesDesiredOptionText(text, desired)) return false;
    return Boolean(closestMatchingContainer(item, form, match));
  });

  if (!control) return false;
  control.click();
  return true;
}

function chooseOptionForQuestionText(form, match, desiredValue) {
  const questionElement = Array.from(form.querySelectorAll("label, legend, p, span, div, h1, h2, h3, h4"))
    .find((element) => match(cleanQuestionText(element.textContent || "")));

  if (!questionElement) return false;

  let container = questionElement;
  for (let depth = 0; container && depth < 5; depth += 1) {
    if (clickMatchingChoiceIn(container, desiredValue)) return true;

    let sibling = container.nextElementSibling;
    for (let i = 0; sibling && i < 4; i += 1) {
      if (clickMatchingChoiceIn(sibling, desiredValue)) return true;
      sibling = sibling.nextElementSibling;
    }

    if (container === form) break;
    container = container.parentElement;
  }

  return false;
}

async function fillGreenhouseCustomQuestions(form, data) {
  const customFields = [
    { labels: ["city", "location city", "location (city)"], value: data["Location (City)"] },
    { labels: ["state", "state/province", "location state", "location (state/region)", "state/province/region"], value: data["Location (State/Region)"] },
    { labels: ["linkedin profile", "linkedin url", "linkedin"], value: data.LinkedIn },
    { labels: ["github profile", "github url", "github"], value: data.Github },
  ];

  for (const field of customFields) {
    if (!field.value) continue;
    const input = findGreenhouseQuestionInput(form, field.labels);
    const inputQuestionText = input ? getInputLabelText(input).toLowerCase() : "";
    if (input && !input.value?.trim() && !isSensitiveYesNoQuestion(inputQuestionText)) {
      setNativeValue(input, field.value);
      await sleep(delays.short);
      continue;
    }

    const container = findQuestionContainer(form, (text) => matchesQuestionLabel(text, field.labels));
    const containerText = cleanQuestionText(container?.textContent || "");
    if (!isSensitiveYesNoQuestion(containerText) && chooseMatchingOption(container, field.value)) {
      await sleep(delays.short);
    }
  }

  const isLegalAuthQuestion = (text) =>
    text.includes("legally authorized") &&
    text.includes("work") &&
    text.includes("united states");

  const legalAuthContainer = findQuestionContainer(form, isLegalAuthQuestion);
  if (
    await clickGreenhouseComboboxOption(legalAuthContainer, legalAuthorizationAnswer(data)) ||
    chooseMatchingOption(legalAuthContainer, legalAuthorizationAnswer(data)) ||
    chooseMatchingOptionNearQuestion(form, isLegalAuthQuestion, legalAuthorizationAnswer(data)) ||
    chooseOptionForQuestionText(form, isLegalAuthQuestion, legalAuthorizationAnswer(data))
  ) {
    await sleep(delays.short);
  }

  const sponsorshipContainer = findQuestionContainer(form, (text) =>
    text.includes("sponsor") ||
    text.includes("sponsorship")
  );
  const isSponsorshipQuestion = (text) =>
    text.includes("sponsor") ||
    text.includes("sponsorship");

  if (
    await clickGreenhouseComboboxOption(sponsorshipContainer, sponsorshipAnswer(data)) ||
    chooseMatchingOption(sponsorshipContainer, sponsorshipAnswer(data)) ||
    chooseMatchingOptionNearQuestion(form, isSponsorshipQuestion, sponsorshipAnswer(data)) ||
    chooseOptionForQuestionText(form, isSponsorshipQuestion, sponsorshipAnswer(data))
  ) {
    await sleep(delays.short);
  }
}

async function awaitForm() {
  // Create a MutationObserver to detect changes in the DOM
  const observer = new MutationObserver((_, observer) => {
    for (let jobForm in fields) {
      if (!window.location.hostname.includes(jobForm)) continue;
      //workday
      if (jobForm == "workday") {
        autofill(null);
        observer.disconnect();
        return;
      }
      let form = document.querySelector(applicationFormQuery);
      if (form) {
        observer.disconnect();
        autofill(form);
        return;
      } else {
        form = document.querySelector("form, #mainContent");
        if (form) {
          observer.disconnect();
          autofill(form);
          return;
        }
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  if (window.location.hostname.includes("lever")) {
    let form = document.querySelector("#application-form, #application_form");
    if (form) autofill(form);
  }
}

async function autofill(form) {
  console.log("Autofill Jobs: Starting autofill.");
  let res = await getStorageDataSync();
  const customFieldMappings = await getCustomFieldMappings();
  res["Current Date"] = curDateStr();
  await sleep(delays.initial);
  for (let jobForm in fields) {
    if (!window.location.hostname.includes(jobForm)) continue;
    if (jobForm == "workday") {
      workDayAutofill(res);
      return;
    }

    for (let jobParam in fields[jobForm]) {
      if (jobParam.toLowerCase() == "resume") {
          let localData = await getStorageDataLocal();
          if (!localData.Resume) continue;

          let resumeDiv = {
            greenhouse: 'input[id="resume"]',
            lever: 'input[id="resume-upload-input"]',
            dover:
              'input[type="file"][accept=".pdf"], input[type="file"][accept="application/pdf"]',
          };
          let el = document.querySelector(resumeDiv[jobForm]);
          if (!el) {
            //old greenhouse forms
            el = document.querySelector('input[type="file"]');
          }
          if (!el) continue;
          el.addEventListener("submit", function (event) {
            event.preventDefault();
          });
          
          const dt = new DataTransfer();
          let arrBfr = base64ToArrayBuffer(localData.Resume);

          dt.items.add(
            new File([arrBfr], `${localData["Resume_name"]}`, {
              type: "application/pdf",
            })
          );
          el.files = dt.files;
          el.dispatchEvent(changeEvent);
          await sleep(delays.short);
          
        
        continue;
      }

      let useLongDelay = false;
      //gets param from user data
      const param = fields[jobForm][jobParam];
      let fillValue = res[param];
      if (!fillValue) continue;
      const mappingCategory = mappingCategoryForParam(param);
      const mappingAliases = mappingCategory && Array.isArray(customFieldMappings[mappingCategory])
        ? customFieldMappings[mappingCategory]
        : [];
      let inputElement = ["First Name", "Last Name"].includes(param)
        ? strictInputQuery(jobParam, form)
        : inputQueryWithAliases(jobParam, form, mappingAliases);
      if (!inputElement) continue;

      if (param === "Gender" || "Location (City)") useLongDelay = true;
      if (param === "Location (City)" && jobParam === "candidate-location") fillValue = formatCityStateCountry(res, param);

      setNativeValue(inputElement, fillValue);
      //for the dropdown elements
      let btn = inputElement.closest(".select__control--outside-label");
      if (!btn) continue;

      btn.dispatchEvent(mouseUpEvent);
      await sleep(useLongDelay ? delays.long : delays.short);
      btn.dispatchEvent(keyDownEvent);
      await sleep(delays.short);
    }
    if (jobForm === "greenhouse") await fillGreenhouseCustomQuestions(form, res);
    scrollToTop();
    await fillRequiredQuestionnaireAnswers(res);
    console.log(`Autofill Jobs: Complete in ${getTimeElapsed(initTime)}s.`);
    return true; //found site
  }
  return false;
  
}

