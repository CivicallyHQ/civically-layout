import { withPluginApi } from 'discourse/lib/plugin-api';
import { placeUrl } from 'discourse/plugins/civically-place/discourse/lib/place-utilities';
import { default as computed } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'navigation-edits',
  initialize(container) {
    const currentUser = container.lookup('current-user:main');

    // the tags index route doesn't make sense yet.
    withPluginApi('0.8.13', api => {
      api.modifyClass('route:tags-index', {
        redirect() {
          this.replaceWith(placeUrl(currentUser));
        }
      });

      api.modifyClass('controller:discovery', {
        @computed('path')
        forceSidebars(path) {
          return path.indexOf('calendar') === -1;
        }
      });

      api.modifyClass('controller:topic', {
        forceSidebars: true
      })
    });
  }
}
