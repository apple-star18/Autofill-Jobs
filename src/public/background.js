chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message?.type !== "DEEPSEEK_QUESTIONNAIRE") return false;

  answerQuestionnaire(message.payload)
    .then((response) => sendResponse({ ok: true, response }))
    .catch((error) => {
      console.error("Autofill Jobs: DeepSeek questionnaire error.", error);
      sendResponse({ ok: false, error: error.message || String(error) });
    });

  return true;
});

async function answerQuestionnaire(payload) {
  const { apiKey, model, questions, jobDescription, profile, customPrompt } = payload;
  if (!apiKey) throw new Error("Missing DeepSeek API key.");
  if (!Array.isArray(questions) || questions.length === 0) {
    return { answers: [] };
  }

  const systemPrompt = [
    "You write truthful job application questionnaire answers.",
    "Return only valid json.",
    "The json must be exactly: {\"answers\":[\"answer 1\",\"answer 2\"]}.",
    "The answers array length must match the questions array length exactly.",
    "Do not invent employment history, credentials, legal eligibility, salary, sponsorship, demographic, veteran, or disability facts.",
    "Use only the provided work experience as candidate background.",
    "If the provided work experience does not contain enough information, answer conservatively from the available information."
  ].join(" ");

  const userPrompt = JSON.stringify({
    instruction: customPrompt || "Answer required job application questions using the profile and job description.",
    requiredQuestions: questions,
    jobDescription,
    profile,
    requiredOutput: {
      answers: questions.map(() => "string")
    }
  });

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || "deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
      stream: false
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || `DeepSeek request failed with ${response.status}.`);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty response.");

  const parsed = JSON.parse(content);
  const answers = Array.isArray(parsed.answers) ? parsed.answers : [];

  return {
    answers: questions.map((_, index) => String(answers[index] || ""))
  };
}
