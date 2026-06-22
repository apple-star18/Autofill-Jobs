<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PrivacyToggle from '@/components/PrivacyToggle.vue';

type StatusType = 'idle' | 'working' | 'success' | 'error';

const fillStatus = ref('Ready');
const statusType = ref<StatusType>('idle');
const activeTabTitle = ref('Current tab');
const activeTabHost = ref('');
const activeTabUrl = ref('');

const supportedHosts = [
  'greenhouse.io',
  'jobs.lever.co',
  'app.dover.com',
  'workday.com',
  'myworkdayjobs.com',
];

const isSupportedPage = computed(() => {
  if (!activeTabHost.value) return false;
  return supportedHosts.some((host) => activeTabHost.value.includes(host));
});

const readinessLabel = computed(() => {
  if (!activeTabHost.value) return 'No active tab';
  return isSupportedPage.value ? 'Supported page' : 'Unsupported page';
});

const updateActiveTab = () => {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) return;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    activeTabTitle.value = tab?.title || 'Current tab';
    activeTabUrl.value = tab?.url || '';

    try {
      activeTabHost.value = activeTabUrl.value ? new URL(activeTabUrl.value).hostname : '';
    } catch (_) {
      activeTabHost.value = '';
    }
  });
};

const openSettings = () => {
  const optionsUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL('options/options.html')
    : '/options/options.html';

  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url: optionsUrl });
    return;
  }

  window.open(optionsUrl, '_blank');
};

const setTransientStatus = (message: string, type: StatusType, clear = true) => {
  fillStatus.value = message;
  statusType.value = type;

  if (!clear) return;
  window.setTimeout(() => {
    fillStatus.value = 'Ready';
    statusType.value = 'idle';
  }, 3200);
};

const fillCurrentPage = () => {
  setTransientStatus('Filling current page...', 'working', false);

  if (typeof chrome === 'undefined' || !chrome.tabs?.query || !chrome.tabs?.sendMessage) {
    setTransientStatus('Open a supported job page in Chrome.', 'error');
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) {
      setTransientStatus('No active tab found.', 'error');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL_JOBS_FILL' }, (response) => {
      if (chrome.runtime.lastError) {
        setTransientStatus('Open a supported job application page first.', 'error');
        return;
      }

      if (response?.ok) {
        setTransientStatus('Fill started on this page.', 'success');
        return;
      }

      setTransientStatus(response?.error || 'Could not fill this page.', 'error');
    });
  });
};

onMounted(updateActiveTab);
</script>

<template>
  <div class="popupShellV2">
    <header class="popupHeader">
      <div class="popupBrand">
        <div class="popupLogo" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="currentColor">
            <path d="M480-118 120-326v-308l360-208 360 208v308L480-118Zm0-92 280-162v-164L480-374 200-536v164l280 162Zm0-256 272-158-272-158-272 158 272 158Z" />
          </svg>
        </div>
        <div>
          <h1>Autofill Jobs</h1>
          <p>{{ readinessLabel }}</p>
        </div>
      </div>

      <PrivacyToggle />
    </header>

    <section class="tabPreview">
      <div>
        <span>Active tab</span>
        <strong>{{ activeTabHost || 'Not available' }}</strong>
      </div>
      <p>{{ activeTabTitle }}</p>
    </section>

    <main class="popupActions">
      <button class="fillButton" type="button" @click="fillCurrentPage">
        <span>
          <strong>Fill Current Page</strong>
          <small>Use saved profile data on this job form</small>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
        </svg>
      </button>

      <button class="settingsButton" type="button" @click="openSettings">
        <span>Settings</span>
        <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor">
          <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Z" />
        </svg>
      </button>
    </main>

    <footer class="popupFooter">
      <span class="statusDot" :class="statusType"></span>
      <span>{{ fillStatus }}</span>
    </footer>
  </div>
</template>
