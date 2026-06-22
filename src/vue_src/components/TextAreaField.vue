<template>
  <div class="textAreaDiv">
    <h2>{{ label }}</h2>
    <textarea :placeholder="placeHolder" v-model="inputValue" @input="saveData" />
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';

export default {
  props: ['label', 'placeHolder'],

  setup(props) {
    const inputValue = ref('');

    const saveData = () => {
      if (typeof chrome === 'undefined' || !chrome.storage) return;
      chrome.storage.sync.set({ [props.label]: inputValue.value }, () => {
        console.log(`${props.label} saved:`, inputValue.value);
      });
    };

    const loadData = () => {
      if (typeof chrome === 'undefined' || !chrome.storage) return;
      chrome.storage.sync.get([props.label], (data) => {
        inputValue.value = data[props.label] || '';
      });
    };

    loadData();

    return {
      inputValue,
      saveData
    };
  },
};
</script>
