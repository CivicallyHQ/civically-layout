import { withPluginApi } from 'discourse/lib/plugin-api';
import { placeUrl } from 'discourse/plugins/civically-place/discourse/lib/place-utilities';

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
    })
  }
}
