<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

type TabKey = 'profile' | 'ai' | 'autofill' | 'about';

type ExperienceEntry = {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  currentJob: boolean;
  description: string;
};

type EducationEntry = {
  degree: string;
  fieldOfStudy: string;
  school: string;
  startDate: string;
  endDate: string;
  gpa: string;
};

type FieldMappingKey = 'name' | 'email' | 'phone';

type FieldMapping = {
  key: FieldMappingKey;
  label: string;
  description: string;
  keywords: string[];
  draft: string;
  editing: boolean;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'ai', label: 'AI Settings' },
  { key: 'autofill', label: 'Auto-fill' },
  { key: 'about', label: 'About' },
];

const workArrangementOptions = ['Remote', 'On-site', 'Hybrid', 'Flexible'];

const aiModelOptions = [
  { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat (Compatibility)' },
];

const activeTab = ref<TabKey>('profile');
const statusMessage = ref('Ready');
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info');
const showSavePopup = ref(false);
const skillInput = ref('');
const resumeName = ref('No file found');

const personalInfo = reactive({
  firstName: '',
  lastName: '',
  fullName: '',
  email: '',
  phone: '',
  phoneType: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
});

const education = ref<EducationEntry[]>([
  { degree: '', fieldOfStudy: '', school: '', startDate: '', endDate: '', gpa: '' },
]);

const workExperience = ref<ExperienceEntry[]>([
  { jobTitle: '', company: '', startDate: '', endDate: '', currentJob: false, description: '' },
]);

const skills = ref<string[]>([]);

const socialInfo = reactive({
  linkedIn: '',
  github: '',
  website: '',
  twitter: '',
  summary: '',
});

const jobPreferences = reactive({
  desiredSalary: '',
  jobType: '',
  workArrangement: [] as string[],
  availability: '',
  willingToRelocate: false,
  willingToTravel: false,
});

const legalInfo = reactive({
  workAuthorization: '',
  requiresSponsorship: false,
  gender: '',
  race: '',
  hispanicLatino: '',
  veteranStatus: '',
  disabilityStatus: '',
});

const aiSettings = reactive({
  provider: 'deepseek',
  apiKey: '',
  model: 'deepseek-v4-flash',
  enabled: true,
  temperature: 0.7,
  questionnairePrompt: 'Answer required job application questions using only my saved work experience. Keep answers truthful, concise, and tailored to the job description.',
  whyCompanyTemplate: '',
  strengthsTemplate: '',
});

const autoFillSettings = reactive({
  enabled: true,
  confirmBeforeFill: true,
  skipOptionalFields: false,
  fillDelay: 500,
});

const fieldMappings = reactive<FieldMapping[]>([
  {
    key: 'name',
    label: 'Name fields',
    description: 'Used for full name, first name, last name, and preferred name inputs.',
    keywords: ['name', 'full name', 'first name', 'last name'],
    draft: '',
    editing: false,
  },
  {
    key: 'email',
    label: 'Email fields',
    description: 'Used for email address inputs.',
    keywords: ['email', 'e-mail', 'mail'],
    draft: '',
    editing: false,
  },
  {
    key: 'phone',
    label: 'Phone fields',
    description: 'Used for phone number inputs.',
    keywords: ['phone', 'telephone', 'mobile', 'cell'],
    draft: '',
    editing: false,
  },
]);

const profileName = computed(() => {
  const parts = [personalInfo.firstName, personalInfo.lastName].filter(Boolean);
  return personalInfo.fullName || parts.join(' ');
});

const setStatus = (message: string, type: typeof statusType.value = 'info') => {
  statusMessage.value = message;
  statusType.value = type;
};

const markDirty = () => {
  setStatus('Unsaved changes', 'warning');
};

const addEducation = () => {
  education.value.push({ degree: '', fieldOfStudy: '', school: '', startDate: '', endDate: '', gpa: '' });
  markDirty();
};

const removeEducation = (index: number) => {
  if (education.value.length === 1) {
    education.value[0] = { degree: '', fieldOfStudy: '', school: '', startDate: '', endDate: '', gpa: '' };
  } else {
    education.value.splice(index, 1);
  }
  markDirty();
};

const addExperience = () => {
  workExperience.value.push({ jobTitle: '', company: '', startDate: '', endDate: '', currentJob: false, description: '' });
  markDirty();
};

const removeExperience = (index: number) => {
  if (workExperience.value.length === 1) {
    workExperience.value[0] = { jobTitle: '', company: '', startDate: '', endDate: '', currentJob: false, description: '' };
  } else {
    workExperience.value.splice(index, 1);
  }
  markDirty();
};

const addSkill = () => {
  const pendingSkills = skillInput.value
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!pendingSkills.length) return;

  pendingSkills.forEach((value) => {
    if (!skills.value.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      skills.value.push(value);
    }
  });
  skillInput.value = '';
  markDirty();
};

const handleSkillKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' && event.key !== ',') return;
  event.preventDefault();
  addSkill();
};

const removeSkill = (index: number) => {
  skills.value.splice(index, 1);
  markDirty();
};

const mappingText = (mapping: FieldMapping) => mapping.keywords.join(', ');

const normalizeKeywords = (value: string) => {
  const seen = new Set<string>();
  return value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => {
      const normalized = keyword.toLowerCase();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const editMapping = (mapping: FieldMapping) => {
  mapping.draft = mappingText(mapping);
  mapping.editing = true;
};

const cancelMapping = (mapping: FieldMapping) => {
  mapping.draft = '';
  mapping.editing = false;
};

const saveMapping = (mapping: FieldMapping) => {
  const keywords = normalizeKeywords(mapping.draft);
  if (!keywords.length) {
    setStatus(`${mapping.label} needs at least one keyword`, 'error');
    return;
  }

  mapping.keywords = keywords;
  mapping.editing = false;
  markDirty();
};

const savedFieldMappings = () => Object.fromEntries(
  fieldMappings.map((mapping) => [mapping.key, [...mapping.keywords]]),
) as Record<FieldMappingKey, string[]>;

const applyFieldMappings = (savedMappings: unknown) => {
  if (!savedMappings || typeof savedMappings !== 'object') return;

  const values = savedMappings as Partial<Record<FieldMappingKey, unknown>>;
  fieldMappings.forEach((mapping) => {
    const keywords = values[mapping.key];
    if (!Array.isArray(keywords)) return;

    const normalized = normalizeKeywords(keywords.filter(Boolean).join(','));
    if (normalized.length) mapping.keywords = normalized;
  });
};

const handleResumeUpload = (event: Event) => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    if (!loadEvent.target?.result) return;
    const b64 = (loadEvent.target.result as string).split(',')[1];
    chrome.storage.local.set({ Resume: b64, Resume_name: file.name }, () => {
      resumeName.value = file.name;
      setStatus('Resume saved', 'success');
    });
  };
  reader.readAsDataURL(file);
};

const formatMonthYear = (value: string) => {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!year || !month) return value;

  const date = new Date(Number(year), Number(month) - 1);
  return `${date.toLocaleString('en-US', { month: 'long' })} ${year}`;
};

const monthNameToNumber = (month: string) => {
  const normalizedMonth = month.toLowerCase().trim();
  const months: Record<string, string> = {
    jan: '01',
    january: '01',
    feb: '02',
    february: '02',
    mar: '03',
    march: '03',
    apr: '04',
    april: '04',
    may: '05',
    jun: '06',
    june: '06',
    jul: '07',
    july: '07',
    aug: '08',
    august: '08',
    sep: '09',
    september: '09',
    oct: '10',
    october: '10',
    nov: '11',
    november: '11',
    dec: '12',
    december: '12',
  };

  return months[normalizedMonth] || '';
};

const parseMonthYear = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'present') return '';
  if (trimmed.includes(' - ')) return parseMonthYear(trimmed.split(/\s+-\s+/)[0] || '');
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;

  const [month, year] = trimmed.split(/\s+/);
  const monthNumber = monthNameToNumber(month || '');
  return monthNumber && year ? `${year}-${monthNumber}` : '';
};

const parseMonthRange = (value: string) => {
  const [start = '', end = ''] = value.split(/\s+-\s+/);
  return {
    startDate: parseMonthYear(start),
    endDate: parseMonthYear(end),
    currentJob: end.trim().toLowerCase() === 'present',
  };
};

const parseLegacyDuration = (duration: string) => {
  return parseMonthRange(duration);
};

const normalizeExperienceEntry = (entry: any): ExperienceEntry => {
  const rangeSource = [entry.jobDuration, entry.startDate, entry.endDate]
    .find((value) => typeof value === 'string' && value.includes(' - ')) || '';
  const parsedRange = parseMonthRange(rangeSource);
  const currentJob = Boolean(entry.currentJob ?? entry.isCurrentEmployer ?? parsedRange.currentJob);
  const rawEndDate = typeof entry.endDate === 'string' && entry.endDate.includes(' - ')
    ? ''
    : entry.endDate || '';

  return {
    jobTitle: entry.jobTitle || '',
    company: entry.jobEmployer || entry.company || '',
    startDate: parseMonthYear(entry.startDate || '') || parsedRange.startDate || '',
    endDate: currentJob ? '' : parseMonthYear(rawEndDate) || parsedRange.endDate || '',
    currentJob,
    description: entry.roleBulletsString || entry.description || '',
  };
};

const normalizeEducationEntry = (entry: any): EducationEntry => {
  const parsedStartDate = parseMonthYear(entry.startDate || '');
  const parsedEndDate = parseMonthYear(entry.endDate || '');

  return {
    degree: entry.degree || '',
    fieldOfStudy: entry.fieldOfStudy || entry.discipline || '',
    school: entry.school || '',
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    gpa: entry.gpa || '',
  };
};

const getMonthYearParts = (value: string) => {
  const parsed = parseMonthYear(value);
  if (!parsed) return { month: '', year: '' };

  const [year = '', month = ''] = parsed.split('-');
  return { month, year };
};

const normalizeWorkArrangement = (value: unknown) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value !== 'string') return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeSkills = (value: unknown) => {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,;\n]/)
      : [];

  const seen = new Set<string>();
  return values
    .map((skill) => String(skill).trim())
    .filter((skill) => {
      const normalized = skill.toLowerCase();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const toLegacyExperience = (entry: ExperienceEntry) => {
  const start = formatMonthYear(entry.startDate);
  const end = entry.currentJob ? 'Present' : formatMonthYear(entry.endDate);
  const [startYear = '', startMonth = ''] = entry.startDate.split('-');
  const [endYear = '', endMonth = ''] = entry.endDate.split('-');

  return {
    jobTitle: entry.jobTitle,
    jobEmployer: entry.company,
    jobDuration: [start, end].filter(Boolean).join(' - '),
    startDate: entry.startDate,
    endDate: entry.currentJob ? '' : entry.endDate,
    startMonth,
    startYear,
    endMonth: entry.currentJob ? '' : endMonth,
    endYear: entry.currentJob ? '' : endYear,
    isCurrentEmployer: entry.currentJob,
    roleBulletsString: entry.description,
  };
};

const loadSettings = () => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  setStatus('Loading settings...', 'info');

  chrome.storage.sync.get(null, (syncData) => {
    chrome.storage.local.get(null, (localData) => {
      personalInfo.firstName = syncData['First Name'] || '';
      personalInfo.lastName = syncData['Last Name'] || '';
      personalInfo.fullName = syncData['Full Name'] || '';
      personalInfo.email = syncData.Email || '';
      personalInfo.phone = syncData.Phone || '';
      personalInfo.phoneType = syncData['Phone Type'] || '';
      personalInfo.address = syncData['Location (Street)'] || '';
      personalInfo.city = syncData['Location (City)'] || '';
      personalInfo.state = syncData['Location (State/Region)'] || '';
      personalInfo.zipCode = syncData['Postal/Zip Code'] || '';
      personalInfo.country = syncData['Location (Country)'] || '';

      socialInfo.linkedIn = syncData.LinkedIn || '';
      socialInfo.github = syncData.Github || '';
      socialInfo.website = syncData.Website || '';
      socialInfo.twitter = syncData['Twitter/X'] || '';
      socialInfo.summary = syncData['Professional Summary'] || '';

      legalInfo.gender = syncData.Gender || '';
      legalInfo.race = syncData.Race || '';
      legalInfo.hispanicLatino = syncData['Hispanic/Latino'] || '';
      legalInfo.veteranStatus = syncData['Veteran Status'] || '';
      legalInfo.disabilityStatus = syncData['Disability Status'] || '';
      legalInfo.workAuthorization = syncData['Work Authorization Status'] || '';
      legalInfo.requiresSponsorship = Boolean(syncData['Requires Sponsorship']);

      aiSettings.apiKey = syncData['DeepSeek API Key'] || '';
      aiSettings.model = syncData['DeepSeek Model'] || syncData['AI Model'] || aiSettings.model;
      aiSettings.questionnairePrompt = syncData['Questionnaire Prompt'] || aiSettings.questionnairePrompt;
      aiSettings.enabled = syncData['Enable AI'] !== false;
      aiSettings.temperature = Number(syncData['AI Temperature'] ?? 0.7);
      aiSettings.whyCompanyTemplate = syncData['Why Company Template'] || '';
      aiSettings.strengthsTemplate = syncData['Strengths Template'] || '';

      autoFillSettings.enabled = syncData['Enable Autofill'] !== false;
      autoFillSettings.confirmBeforeFill = syncData['Confirm Before Fill'] !== false;
      autoFillSettings.skipOptionalFields = Boolean(syncData['Skip Optional Fields']);
      autoFillSettings.fillDelay = Number(syncData['Fill Delay'] || 500);
      applyFieldMappings(localData.fieldMappings || syncData['Field Mappings']);

      jobPreferences.desiredSalary = syncData['Desired Salary Range'] || '';
      jobPreferences.jobType = syncData['Preferred Job Type'] || '';
      jobPreferences.workArrangement = normalizeWorkArrangement(localData.userProfile?.jobPreferences?.workArrangement || syncData['Work Arrangement']);
      jobPreferences.availability = syncData.Availability || '';
      jobPreferences.willingToRelocate = Boolean(syncData['Willing To Relocate']);
      jobPreferences.willingToTravel = Boolean(syncData['Willing To Travel']);

      const profileEducation = localData.userProfile?.education;
      const loadedEducation = Array.isArray(profileEducation) && profileEducation.length
        ? profileEducation
        : [{
          school: syncData.School || '',
          degree: syncData.Degree || '',
          fieldOfStudy: syncData.Discipline || '',
          startDate: syncData['Start Date Year'] && syncData['Start Date Month']
            ? `${syncData['Start Date Year']}-${String(syncData['Start Date Month']).padStart(2, '0')}`
            : '',
          endDate: syncData['End Date Year'] && syncData['End Date Month']
            ? `${syncData['End Date Year']}-${String(syncData['End Date Month']).padStart(2, '0')}`
            : '',
          gpa: syncData.GPA || '',
        }];
      education.value = loadedEducation.map(normalizeEducationEntry);

      const details = typeof localData.Resume_details === 'string'
        ? JSON.parse(localData.Resume_details || '{}')
        : localData.Resume_details || {};

      skills.value = normalizeSkills(
        Array.isArray(localData.userProfile?.skills) && localData.userProfile.skills.length
          ? localData.userProfile.skills
          : Array.isArray(details.skills) && details.skills.length
            ? details.skills
            : syncData.Skills,
      );
      const profileExperience = localData.userProfile?.workExperience;
      const loadedExperience = Array.isArray(profileExperience) && profileExperience.length
        ? profileExperience
        : Array.isArray(details.experiences) ? details.experiences : [];
      workExperience.value = loadedExperience.length
        ? loadedExperience.map(normalizeExperienceEntry)
        : [{ jobTitle: '', company: '', startDate: '', endDate: '', currentJob: false, description: '' }];

      resumeName.value = localData.Resume_name || 'No file found';
      setStatus('Settings loaded successfully', 'success');
    });
  });
};

const saveSettings = () => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  addSkill();
  skills.value = normalizeSkills(skills.value);

  setStatus('Saving settings...', 'info');
  const savedSkills = [...skills.value];
  const savedEducation = education.value.map((entry) => ({ ...entry }));
  const savedWorkExperience = workExperience.value.map((entry) => ({ ...entry }));
  const firstEducation = savedEducation[0];
  const educationStart = getMonthYearParts(firstEducation?.startDate || '');
  const educationEnd = getMonthYearParts(firstEducation?.endDate || '');
  const workArrangementText = jobPreferences.workArrangement.join(', ');

  const legacySyncData = {
    'First Name': personalInfo.firstName,
    'Last Name': personalInfo.lastName,
    'Full Name': personalInfo.fullName || profileName.value,
    Email: personalInfo.email,
    Phone: personalInfo.phone,
    'Phone Type': personalInfo.phoneType,
    'Location (Street)': personalInfo.address,
    'Location (City)': personalInfo.city,
    'Location (State/Region)': personalInfo.state,
    'Postal/Zip Code': personalInfo.zipCode,
    'Location (Country)': personalInfo.country,
    LinkedIn: socialInfo.linkedIn,
    Github: socialInfo.github,
    Website: socialInfo.website,
    'Twitter/X': socialInfo.twitter,
    'Professional Summary': socialInfo.summary,
    School: education.value[0]?.school || '',
    Degree: education.value[0]?.degree || '',
    Discipline: education.value[0]?.fieldOfStudy || '',
    'Start Date Month': educationStart.month,
    'Start Date Year': educationStart.year,
    'End Date Month': educationEnd.month,
    'End Date Year': educationEnd.year,
    GPA: education.value[0]?.gpa || '',
    Skills: savedSkills.join(', '),
    'Current Employer': workExperience.value.find((entry) => entry.currentJob)?.company || '',
    Gender: legalInfo.gender,
    Race: legalInfo.race,
    'Hispanic/Latino': legalInfo.hispanicLatino,
    'Veteran Status': legalInfo.veteranStatus,
    'Disability Status': legalInfo.disabilityStatus,
    'Work Authorization Status': legalInfo.workAuthorization,
    'Requires Sponsorship': legalInfo.requiresSponsorship,
    'Desired Salary Range': jobPreferences.desiredSalary,
    'Preferred Job Type': jobPreferences.jobType,
    'Work Arrangement': workArrangementText,
    Availability: jobPreferences.availability,
    'Willing To Relocate': jobPreferences.willingToRelocate,
    'Willing To Travel': jobPreferences.willingToTravel,
    'DeepSeek API Key': aiSettings.apiKey,
    'DeepSeek Model': aiSettings.model,
    'Questionnaire Prompt': aiSettings.questionnairePrompt,
    'Enable AI': aiSettings.enabled,
    'AI Temperature': aiSettings.temperature,
    'Why Company Template': aiSettings.whyCompanyTemplate,
    'Strengths Template': aiSettings.strengthsTemplate,
    'Enable Autofill': autoFillSettings.enabled,
    'Confirm Before Fill': autoFillSettings.confirmBeforeFill,
    'Skip Optional Fields': autoFillSettings.skipOptionalFields,
    'Fill Delay': autoFillSettings.fillDelay,
    'Field Mappings': savedFieldMappings(),
  };

  const userProfile = {
    personalInfo: { ...personalInfo },
    education: savedEducation,
    workExperience: savedWorkExperience,
    skills: savedSkills,
    additionalInfo: { ...socialInfo },
    jobPreferences: { ...jobPreferences },
    legalCompliance: { ...legalInfo },
  };

  const localData = {
    userProfile,
    aiSettings: { ...aiSettings },
    autoFillSettings: { ...autoFillSettings },
    fieldMappings: savedFieldMappings(),
    Resume_details: {
      skills: savedSkills,
      experiences: savedWorkExperience
        .filter((entry) => entry.jobTitle || entry.company)
        .map(toLegacyExperience),
    },
  };

  chrome.storage.sync.set(legacySyncData, () => {
    chrome.storage.local.set(localData, () => {
      setStatus('Settings saved successfully', 'success');
      showSavePopup.value = true;
    });
  });
};

const exportData = () => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  chrome.storage.sync.get(null, (syncData) => {
    chrome.storage.local.get(null, (localData) => {
      const data = { sync: syncData, local: { ...localData } };
      if (data.sync['DeepSeek API Key']) data.sync['DeepSeek API Key'] = '[REDACTED]';
      if (data.local.aiSettings?.apiKey) data.local.aiSettings.apiKey = '[REDACTED]';

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `autofill-jobs-settings-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      setStatus('Settings exported successfully', 'success');
    });
  });
};

const resetSettings = () => {
  if (!window.confirm('Reset all Autofill Jobs settings? This cannot be undone.')) return;
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  chrome.storage.sync.clear(() => {
    chrome.storage.local.clear(() => {
      window.location.reload();
    });
  });
};

const testAI = () => {
  if (!aiSettings.apiKey) {
    setStatus('Enter a DeepSeek API key first', 'error');
    return;
  }
  setStatus('AI settings are ready for questionnaire autofill', 'success');
};

onMounted(loadSettings);
</script>

<template>
  <main class="optionsPage">
    <header class="optionsHero">
      <div class="optionsHeroInner">
        <div class="optionsBrand">
          <div class="brandMark" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="currentColor">
              <path d="M480-118 120-326v-308l360-208 360 208v308L480-118Zm0-92 280-162v-164L480-374 200-536v164l280 162Zm0-256 272-158-272-158-272 158 272 158Z" />
            </svg>
          </div>
          <div>
            <h1>Autofill Jobs</h1>
            <p>Configure your job application assistant</p>
          </div>
        </div>

        <div class="optionsActions">
          <button type="button" class="heroButton" @click="exportData">Export Data</button>
          <button type="button" class="heroButton" @click="saveSettings">Save Settings</button>
        </div>
      </div>
    </header>

    <nav class="optionsTabs" aria-label="Settings sections">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'profile'" class="mainContent">
      <div class="optionsCard">
        <h2>Personal Information</h2>
        <div class="formGrid">
          <label class="formGroup">First Name<input v-model="personalInfo.firstName" placeholder="Enter your first name" @input="markDirty"></label>
          <label class="formGroup">Last Name<input v-model="personalInfo.lastName" placeholder="Enter your last name" @input="markDirty"></label>
          <label class="formGroup">Email Address<input v-model="personalInfo.email" type="email" placeholder="your.email@example.com" @input="markDirty"></label>
          <label class="formGroup">Phone Number<input v-model="personalInfo.phone" type="tel" placeholder="+1 (555) 123-4567" @input="markDirty"></label>
          <label class="formGroup">Phone Type
            <select v-model="personalInfo.phoneType" @change="markDirty">
              <option value="">Select Type</option>
              <option>Landline</option>
              <option>Mobile</option>
              <option>Office Phone</option>
            </select>
          </label>
          <label class="formGroup fullWidth">Address<input v-model="personalInfo.address" placeholder="123 Main Street" @input="markDirty"></label>
          <label class="formGroup">City<input v-model="personalInfo.city" placeholder="New York" @input="markDirty"></label>
          <label class="formGroup">State/Province<input v-model="personalInfo.state" placeholder="NY" @input="markDirty"></label>
          <label class="formGroup">ZIP/Postal Code<input v-model="personalInfo.zipCode" placeholder="10001" @input="markDirty"></label>
          <label class="formGroup">Country<input v-model="personalInfo.country" placeholder="United States" @input="markDirty"></label>
        </div>
      </div>

      <div class="optionsCard">
        <h2>Education</h2>
        <div v-for="(entry, index) in education" :key="index" class="entryCard">
          <button type="button" class="entryRemove" @click="removeEducation(index)">x</button>
          <div class="formGrid twoColumn">
            <label class="formGroup">Degree
              <select v-model="entry.degree" @change="markDirty">
                <option value="">Select Degree</option>
                <option>High School Diploma</option>
                <option>Associate's Degree</option>
                <option>Bachelor's Degree</option>
                <option>Master's Degree</option>
                <option>PhD</option>
                <option>Professional Certificate</option>
                <option>Bootcamp</option>
              </select>
            </label>
            <label class="formGroup">Field of Study<input v-model="entry.fieldOfStudy" placeholder="Computer Science" @input="markDirty"></label>
            <label class="formGroup">School/University<input v-model="entry.school" placeholder="University of Technology" @input="markDirty"></label>
            <label class="formGroup">Start Date<input v-model="entry.startDate" type="month" @input="markDirty"></label>
            <label class="formGroup">End Date<input v-model="entry.endDate" type="month" @input="markDirty"></label>
            <label class="formGroup">GPA (Optional)<input v-model="entry.gpa" placeholder="3.8/4.0" @input="markDirty"></label>
          </div>
        </div>
        <button type="button" class="secondaryAction" @click="addEducation">Add Another Education</button>
      </div>

      <div class="optionsCard">
        <h2>Work Experience</h2>
        <div v-for="(entry, index) in workExperience" :key="index" class="entryCard">
          <button type="button" class="entryRemove" @click="removeExperience(index)">x</button>
          <div class="formGrid twoColumn">
            <label class="formGroup">Job Title<input v-model="entry.jobTitle" placeholder="Software Engineer" @input="markDirty"></label>
            <label class="formGroup">Company<input v-model="entry.company" placeholder="Tech Corp Inc." @input="markDirty"></label>
            <label class="formGroup">Start Date<input v-model="entry.startDate" type="month" @input="markDirty"></label>
            <label class="formGroup">End Date<input v-model="entry.endDate" type="month" :disabled="entry.currentJob" @input="markDirty"></label>
          </div>
          <label class="checkboxLabel"><input v-model="entry.currentJob" type="checkbox" @change="markDirty"><span></span>I currently work here</label>
          <label class="formGroup">Job Description<textarea v-model="entry.description" rows="4" placeholder="Describe your responsibilities, achievements, and key projects..." @input="markDirty"></textarea></label>
        </div>
        <button type="button" class="secondaryAction" @click="addExperience">Add Another Experience</button>
      </div>

      <div class="optionsCard">
        <h2>Skills & Competencies</h2>
        <label class="formGroup">Technical Skills
          <div class="skillInputRow">
            <input v-model="skillInput" placeholder="Type a skill and press Enter" @keydown="handleSkillKeydown">
            <button type="button" @click="addSkill">Add</button>
          </div>
        </label>
        <div class="skillsTags">
          <button v-for="(skill, index) in skills" :key="skill" type="button" class="skillTag" @click="removeSkill(index)">
            {{ skill }} <span>x</span>
          </button>
        </div>
      </div>

      <div class="optionsCard">
        <h2>Additional Information</h2>
        <label class="formGroup">Professional Summary<textarea v-model="socialInfo.summary" rows="4" placeholder="Brief overview of your professional background..." @input="markDirty"></textarea></label>
        <div class="formGrid">
          <label class="formGroup">LinkedIn Profile<input v-model="socialInfo.linkedIn" type="url" placeholder="https://linkedin.com/in/yourprofile" @input="markDirty"></label>
          <label class="formGroup">Portfolio/Website<input v-model="socialInfo.website" type="url" placeholder="https://yourportfolio.com" @input="markDirty"></label>
          <label class="formGroup">GitHub Profile<input v-model="socialInfo.github" type="url" placeholder="https://github.com/yourusername" @input="markDirty"></label>
          <label class="formGroup">Twitter/X<input v-model="socialInfo.twitter" type="url" placeholder="https://x.com/yourusername" @input="markDirty"></label>
        </div>
      </div>

      <div class="optionsCard">
        <h2>Job Preferences</h2>
        <div class="formGrid twoColumn">
          <label class="formGroup">Desired Salary Range<input v-model="jobPreferences.desiredSalary" placeholder="$80,000 - $120,000" @input="markDirty"></label>
          <label class="formGroup">Preferred Job Type
            <select v-model="jobPreferences.jobType" @change="markDirty">
              <option value="">Select Type</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Freelance</option>
              <option>Internship</option>
            </select>
          </label>
          <label class="formGroup">Work Arrangement
            <div class="checkboxGrid">
              <label v-for="option in workArrangementOptions" :key="option" class="checkboxLabel compact">
                <input v-model="jobPreferences.workArrangement" type="checkbox" :value="option" @change="markDirty">
                <span></span>{{ option }}
              </label>
            </div>
          </label>
          <label class="formGroup">Availability
            <select v-model="jobPreferences.availability" @change="markDirty">
              <option value="">Select Availability</option>
              <option>Immediately</option>
              <option>2 weeks notice</option>
              <option>1 month notice</option>
              <option>2 months notice</option>
              <option>3+ months</option>
            </select>
          </label>
        </div>
        <label class="checkboxLabel"><input v-model="jobPreferences.willingToRelocate" type="checkbox" @change="markDirty"><span></span>Willing to relocate</label>
        <label class="checkboxLabel"><input v-model="jobPreferences.willingToTravel" type="checkbox" @change="markDirty"><span></span>Willing to travel for work</label>
      </div>

      <div class="optionsCard">
        <h2>Legal & Compliance</h2>
        <div class="formGrid twoColumn">
          <label class="formGroup">Work Authorization Status
            <select v-model="legalInfo.workAuthorization" @change="markDirty">
              <option value="">Select Status</option>
              <option>US Citizen</option>
              <option>Permanent Resident</option>
              <option>Work Visa</option>
              <option>Student Visa</option>
              <option>Need Sponsorship</option>
            </select>
          </label>
          <label class="formGroup">Gender<select v-model="legalInfo.gender" @change="markDirty"><option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Decline To Self Identify</option></select></label>
          <label class="formGroup">Race<select v-model="legalInfo.race" @change="markDirty"><option value="">Prefer not to say</option><option>American Indian or Alaskan Native</option><option>Asian</option><option>Black or African American</option><option>White</option><option>Native Hawaiian or Other Pacific Islander</option><option>Two or More Races</option><option>Decline To Self Identify</option></select></label>
          <label class="formGroup">Hispanic/Latino<select v-model="legalInfo.hispanicLatino" @change="markDirty"><option value="">Prefer not to say</option><option>Yes</option><option>No</option><option>Decline To Self Identify</option></select></label>
          <label class="formGroup">Veteran Status<select v-model="legalInfo.veteranStatus" @change="markDirty"><option value="">Prefer not to say</option><option>I am not a protected veteran</option><option>I identify as one or more of the classifications of a protected veteran</option><option>I don't wish to answer</option></select></label>
          <label class="formGroup">Disability Status<select v-model="legalInfo.disabilityStatus" @change="markDirty"><option value="">Prefer not to say</option><option>Yes, I have a disability, or have had one in the past</option><option>No, I do not have a disability and have not had one in the past</option><option>I do not want to answer</option></select></label>
        </div>
        <label class="checkboxLabel"><input v-model="legalInfo.requiresSponsorship" type="checkbox" @change="markDirty"><span></span>Requires visa sponsorship for employment</label>
      </div>
    </section>

    <section v-if="activeTab === 'ai'" class="mainContent">
      <div class="optionsCard">
        <h2>AI Configuration</h2>
        <div class="formGrid twoColumn">
          <label class="formGroup">AI Provider<select v-model="aiSettings.provider" @change="markDirty"><option value="deepseek">DeepSeek</option></select></label>
          <label class="formGroup">Model
            <select v-model="aiSettings.model" @change="markDirty">
              <option v-for="model in aiModelOptions" :key="model.value" :value="model.value">{{ model.label }}</option>
            </select>
          </label>
          <label class="formGroup fullWidth">DeepSeek API Key<input v-model="aiSettings.apiKey" type="password" placeholder="sk-..." @input="markDirty"></label>
        </div>
        <label class="checkboxLabel"><input v-model="aiSettings.enabled" type="checkbox" @change="markDirty"><span></span>Enable AI-powered responses for complex questions</label>
        <label class="formGroup">Response Creativity<input v-model.number="aiSettings.temperature" type="range" min="0" max="1" step="0.1" @input="markDirty"></label>
        <div class="rangeLabels"><span>Conservative</span><span>Creative</span></div>
        <button type="button" class="secondaryAction" @click="testAI">Test AI Response</button>
      </div>

      <div class="optionsCard">
        <h2>Response Templates</h2>
        <label class="formGroup">Questionnaire Prompt<textarea v-model="aiSettings.questionnairePrompt" rows="4" @input="markDirty"></textarea></label>
        <label class="formGroup">Why do you want to work here?<textarea v-model="aiSettings.whyCompanyTemplate" rows="4" placeholder="Template for company interest questions..." @input="markDirty"></textarea></label>
        <label class="formGroup">What are your strengths?<textarea v-model="aiSettings.strengthsTemplate" rows="4" placeholder="Template for strengths questions..." @input="markDirty"></textarea></label>
      </div>
    </section>

    <section v-if="activeTab === 'autofill'" class="mainContent">
      <div class="optionsCard">
        <h2>Auto-fill Preferences</h2>
        <label class="checkboxLabel"><input v-model="autoFillSettings.enabled" type="checkbox" @change="markDirty"><span></span>Enable automatic form filling</label>
        <label class="checkboxLabel"><input v-model="autoFillSettings.confirmBeforeFill" type="checkbox" @change="markDirty"><span></span>Ask for confirmation before filling</label>
        <label class="checkboxLabel"><input v-model="autoFillSettings.skipOptionalFields" type="checkbox" @change="markDirty"><span></span>Skip optional fields</label>
        <label class="formGroup">Fill Delay (milliseconds)<input v-model.number="autoFillSettings.fillDelay" type="number" min="0" max="5000" step="100" @input="markDirty"></label>
      </div>

      <div class="optionsCard">
        <h2>Resume Upload</h2>
        <label class="formGroup">Resume PDF<input type="file" accept="application/pdf,.pdf" @change="handleResumeUpload"></label>
        <p class="mutedText">{{ resumeName }}</p>
      </div>

      <div class="optionsCard">
        <h2>Field Mapping</h2>
        <p class="sectionDescription">Customize how fields are detected and filled in supported job boards.</p>
        <div class="mappingList">
          <div v-for="mapping in fieldMappings" :key="mapping.key" class="mappingItem" :class="{ editing: mapping.editing }">
            <div class="mappingTitle">
              <span>{{ mapping.label }}</span>
              <small>{{ mapping.description }}</small>
            </div>

            <template v-if="mapping.editing">
              <label class="mappingEditor">
                Keywords
                <input
                  v-model="mapping.draft"
                  type="text"
                  placeholder="Separate keywords with commas"
                  @keydown.enter.prevent="saveMapping(mapping)"
                >
              </label>
              <div class="mappingActions">
                <button type="button" class="mappingSaveButton" @click="saveMapping(mapping)">Save</button>
                <button type="button" class="mappingCancelButton" @click="cancelMapping(mapping)">Cancel</button>
              </div>
            </template>

            <template v-else>
              <small class="mappingKeywords">{{ mappingText(mapping) }}</small>
              <button type="button" @click="editMapping(mapping)">Edit</button>
            </template>
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'about'" class="mainContent">
      <div class="optionsCard aboutCard">
        <h2>About Autofill Jobs</h2>
        <div class="aboutContent">
          <div><h3>Version 1.0.0</h3><p>AI-powered job application assistant.</p></div>
          <div>
            <h3>Features</h3>
            <ul>
              <li>Intelligent form detection and filling</li>
              <li>AI-powered response generation</li>
              <li>Customizable user profiles</li>
              <li>Local Chrome storage for settings</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <footer class="statusBar">
      <div class="statusMessage" :class="statusType">{{ statusMessage }}</div>
      <button type="button" class="linkButton" @click="resetSettings">Reset to Defaults</button>
    </footer>

    <div v-if="showSavePopup" class="savePopup" @click.self="showSavePopup = false">
      <div class="savePopupContent">
        <div class="savePopupIcon">
          <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="currentColor">
            <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
          </svg>
        </div>
        <h3>Settings Saved</h3>
        <p>Your profile information has been saved and is ready to use for auto-filling job applications.</p>
        <button type="button" @click="showSavePopup = false">Got it</button>
      </div>
    </div>
  </main>
</template>
