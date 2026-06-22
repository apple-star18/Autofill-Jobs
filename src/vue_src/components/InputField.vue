<template>
  <div class="inputFieldDiv">
    <h2 style="align-items: center; display: flex; gap:1rem;">{{ label }} <svg v-if="explanation"
        @click="showExplanation" style='cursor: pointer;' xmlns="http://www.w3.org/2000/svg" height="24px"
        viewBox="0 -960 960 960" width="24px" fill="#5f6368">
        <path
          d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
      </svg></h2>

    <input v-if="!dropDowns.includes(label) && !files.includes(label)" :type="hidden" :placeholder="placeHolder"
      v-model="inputValue" @input="saveData" @focus="onFocus" @blur="onBlur" />
    <div v-if="files.includes(label)" class="inputFieldfileHolder">
      <input v-if="files.includes(label)" type="file" title="" value="" :placeholder="placeHolder"
        @change="saveResume" />
      <h2 v-if="files.includes(label)">{{ inputValue }}</h2>
    </div>

    <select :class=hidden v-if="dropDowns.includes(label)" v-model="inputValue" @change="dropdownPrivacy">

      <option v-for="option in placeHolder" :key="option" :value="option">{{ option }}</option>
    </select>

  </div>
</template>

<script lang="ts">
import { ref, watch } from 'vue';
import { usePrivacy } from '@/composables/Privacy';
import { useExplanation } from '@/composables/Explanation.ts';
export default {
  props: ['label', 'placeHolder', 'explanation'],
  data() {
    return {
      dropDowns: ['Gender', 'Hispanic/Latino', 'Veteran Status', 'Disability Status', 'Degree', 'Start Date Month', 'End Date Month', 'Race', 'Phone Type'],
      files: ['Resume']
    };
  },

  setup(props) {
    // Declare a reactive input value using Vue's ref
    const inputValue = ref('');
    // Use the composable
    const { privacy } = usePrivacy();
    const hidden = ref('text');
    const { toggleExplanation, setExplanation } = useExplanation();
    watch(privacy, (newVal) => {
      hidden.value = newVal ? 'password' : 'text';
    });

    const showExplanation = () => {
      setExplanation(props.explanation);
      toggleExplanation();
    }

    const saveResume = (event: Event) => {
      if (typeof chrome === 'undefined' || !chrome.storage) return;
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          if (!e.target?.result) return;
          const b64 = (e.target.result as string).split(',')[1];
          chrome.storage.local.set({ [`${props.label + '_name'}`]: file.name }, () => {
            inputValue.value = file.name
            console.log(`${props.label} + _name saved:`, file.name);
          });
          chrome.storage.local.set({ [props.label]: b64 }, () => {
            console.log(`${props.label} saved:`, b64);
          });
        };
        reader.readAsDataURL(file);
      }
    };
    const saveData = () => {
      if (typeof chrome === 'undefined' || !chrome.storage) return;
      // Store the value of the input field in chrome storage
      chrome.storage.sync.set({ [props.label]: inputValue.value }, () => {
        console.log(`${props.label} saved:`, inputValue.value);
      });
    };
    const loadData = () => {
      if (typeof chrome === 'undefined' || !chrome.storage) return;
      chrome.storage.sync.get([props.label], (data) => {

        inputValue.value = data[props.label] || '';  // Default to empty string if no value is found
        if (inputValue.value == '' && props.label === "Resume") {
          chrome.storage.local.get([`${props.label + '_name'}`], (data) => {

            inputValue.value = data[`${props.label + '_name'}`] || 'No file found';  // Default to empty string if no value is found
          });
        }
      });
    };
    const onFocus = () => {
      if (privacy.value) hidden.value = "text";

    };
    const onBlur = () => {
      if (privacy.value) hidden.value = "password";

    };
    const dropdownPrivacy = () => {
      saveData();
      if (privacy.value) onBlur();
    }
    // Load data when the component is mounted
    loadData();

    return {
      inputValue,
      saveData,
      saveResume,
      hidden,
      onFocus,
      onBlur,
      dropdownPrivacy,
      showExplanation
    };
  },
};
</script>
