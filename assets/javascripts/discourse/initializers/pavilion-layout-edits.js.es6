import { withPluginApi } from 'discourse/lib/plugin-api';
import { on } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'civically-layout-edits',
  initialize() {

    // this prevents the bolded messages at the end of the topic list from appearing
    withPluginApi('0.8.12', api => {
      api.modifyClass('controller:discovery/topics', {
        allLoaded: false
      });

      api.modifyClass('model:topic', {
        @on('init')
        suggestedTopics() {}
      });
    });
  }
};
