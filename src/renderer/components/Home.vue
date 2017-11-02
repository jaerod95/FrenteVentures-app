<template id="top">
<div>
  <button @click="exportOpenOmniplan">Execute applescript</button>
  <select-project v-if="showModal" @close="updateAirTable" :projects="projects"></select-project>
  </div>
</template>

<script>
import applescript from 'applescript';
import * as csvParser from 'csv-parse';
import airtable from 'airtable';
import fs from 'fs';
import * as scripts from '@/assets/scripts';

// eslint-disable-next-line
const { dialog } = require('electron').remote;

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
            results.forEach(v => {
              V.projects.push(v.fields.Name);
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

      base('Tasks')
        .select({
          filterByFormula: `{Project} = "${project}"`,
        })
        .all()
        .then(
          results => {
            console.log(results);
            V.omniData.forEach(val => {
              if (
                // eslint-disable-next-line
                results.find(el => {
                  return el.Name === val.Title;
                })
              ) {
                console.log('FOUND');
              } else {
                base('Tasks').create(
                  {
                    Name: val.Title,
                    Due: '2017-11-10',
                    Project: project,
                  },
                  (err, record) => {
                    if (err) console.error(err);
                    else {
                      console.log(record);
                    }
                  },
                );
              }
            });
          },
          err => {
            console.error(err);
          },
        );
      console.log(project);
      console.log(V.omniData);
    },
  },
};
</script>

<style scoped>
#top {
  background: #2f2f2f;
}
</style>
