<template>
  <div id="bar">
    <div id="progress-bar"></div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'; // eslint-disable-line

export default {
  mounted() {
    ipcRenderer.on('progress', (event, text) => {
      console.log(text);
      document.getElementById('progress-bar').style.width = `${text}%`;
    });
  },
};
</script>

<style lang="scss" scoped>
#bar {
  width: 100%;
  height: 5px;
  background: #aaa;
  border-radius: 2.5px;

  #progress-bar {
    height: 100%;
    width: 5%;
    background: #5cb85c;
    border-radius: inherit;
  }
}
</style>
