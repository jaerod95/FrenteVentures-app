<template>
<div class="wrapper">
  <p><bold>Downloading and installing update:</bold></p>
  <div id="bar">
    <div id="progress-bar"></div>
  </div>
  <p id="percent-done">{{percentDone}}</p>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'; // eslint-disable-line

export default {
  data() {
    return {
      percentDone: '0%',
    };
  },
  mounted() {
    const V = this;
    ipcRenderer.on('progress', (event, text) => {
      console.log(text);
      V.percentDone = `${text}%`;
      document.getElementById('progress-bar').style.width = V.percentDone;
    });
  },
};
</script>

<style lang="scss" scoped>
.wrapper {
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
}
</style>
