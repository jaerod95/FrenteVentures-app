<template id="top">
<div>
  <button @click="exportOpenOmniplan">Export Open OmniPlan To Air Table</button>
  <button @click="importAirTableToOpenOmniplan">Import AirTable to open omniPlan</button>
  <select-project v-if="showModal" @close="updateAirTable" :projects="projects"></select-project>
      <div class="title">Information</div>
    <div class="items">
      <div class="item">
        <div class="name">Path:</div>
        <div class="value">{{ path }}</div>
      </div>
      <div class="item">
        <div class="name">Route Name:</div>
        <div class="value">{{ name }}</div>
      </div>
      <div class="item">
        <div class="name">Vue.js:</div>
        <div class="value">{{ vue }}</div>
      </div>
      <div class="item">
        <div class="name">Electron:</div>
        <div class="value">{{ electron }}</div>
      </div>
      <div class="item">
        <div class="name">Node:</div>
        <div class="value">{{ node }}</div>
      </div>
      <div class="item">
        <div class="name">Platform:</div>
        <div class="value">{{ platform }}</div>
      </div>
      <div class="item">
        <div class="name">App Version:</div>
        <div class="value">{{ app_version }}</div>
      </div>
      <div class="item">
        <div class="name">Dev Type:</div>
        <div class="value">{{ dev_type }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'; // eslint-disable-line
import applescript from 'applescript';
import * as csvParser from 'csv-parse';
import airtable from 'airtable';
import fs from 'fs';
import * as scripts from '@/assets/scripts';

// eslint-disable-next-line
const { dialog } = require('electron').remote;

ipcRenderer.on('message', (event, text) => {
  console.log('Message from updater: ', text);
});

// Configure Airtable //

airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyTceinx3TaJO0bD',
});
const base = airtable.base('app5p4NpLJtiByX7C');

export default {
  data() {
    return {
      showModal: false,
      projects: [],
      omniData: {},
      electron: process.versions['atom-shell'],
      name: 'landing-page',
      node: process.versions.node,
      path: '/',
      platform: require('os').platform(),
      vue: require('vue/package.json').version,
      app_version: require('@/../../package.json').version,
      dev_type: process.env.NODE_ENV,
    };
  },
  methods: {
    exportOpenOmniplan() {
      const V = this;

      const dir = './tmp';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      V.runAppleScript(scripts.scriptExportOpenOmniplan(dir)).then(
        () => {
          V.parseCSV('./tmp/temp.csv').then(
            data => {
              V.omniData = data;
              console.log(data);
              V.getProjectFromUser();
            },
            err => {
              dialog.showErrorBox('CSV Parsing Error', err.message);
            },
          );
        },
        err => {
          dialog.showErrorBox('OmniPlan Export Error', err.message);
        },
      );
    },
    importAirTableToOpenOmniplan() {
      alert('NOT IMPLEMENTED YET');
    },
    runAppleScript(script) {
      return new Promise((resolve, reject) => {
        applescript.execString(script, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
    parseCSV(filePath) {
      return new Promise((resolve, reject) => {
        csvParser(
          fs.readFileSync(filePath),
          { columns: true },
          (err, output) => {
            if (err) reject(err);
            else resolve(output);
          },
        );
      });
    },
    getProjectFromUser() {
      const V = this;
      base('Projects')
        .select()
        .all()
        .then(
          results => {
            console.log(results);
            results.forEach(v => {
              V.projects.push(v);
            });
            V.showModal = true;
          },
          err => {
            console.error(err);
          },
        );
    },
    updateAirTable(project) {
      const V = this;
      V.showModal = false;
      project = JSON.parse(project);
      console.log(project);

      base('Tasks')
        .select({
          filterByFormula: `{Project} = "${project.fields.Name}"`,
        })
        .all()
        .then(
          results => {
            results.forEach(val => {
              // eslint-disable-next-line
              let found = V.omniData.find(el => {
                return el.Title === val.fields.Name;
              });
              if (!found) {
                console.log('not found');
                console.log(val);
                base('Tasks').destroy(val.id, (err, deletedRecord) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                  console.log('Deleted record', deletedRecord.id);
                });
              }
            });

            V.omniData.forEach(val => {
              // eslint-disable-next-line
              let task = results.find(el => {
                return el.fields.Name === val.Title;
              });
              if (task) {
                console.log('FOUND');
                console.log(task);
              } else {
                const date = val.End.split('/');
                const newTask = {
                  Name: val.Title,
                  Due: `20${date[2]}-${date[0]}-${date[1]}`,
                  Project: [project.id],
                  Completed: parseInt(val['%Done'].split('%')[0], 10),
                };
                if (val.Assigned !== '') {
                  console.log(val.Assigned);
                  newTask.Assignee = val.Assigned.split('; ');
                }
                base('Tasks').create(newTask, (err, record) => {
                  if (err) console.error(err);
                  else {
                    console.log(record);
                  }
                });
              }
            });
          },
          err => {
            console.error(err);
          },
        );
    },
  },
};
</script>

<style scoped lang="scss">
button {
  padding: 5px;
  margin: 25px;
}
</style>
