import { withPluginApi } from 'discourse/lib/plugin-api';
import { placeUrl } from 'discourse/plugins/civically-place/discourse/lib/place-utilities';
import { default as computed } from 'ember-addons/ember-computed-decorators';
import DiscourseURL from 'discourse/lib/url';

export default {
  name: 'navigation-edits',
  initialize(container) {
    const site = container.lookup('site:main');
    const currentUser = container.lookup('current-user:main');

    // the tags index route doesn't make sense yet.
    withPluginApi('0.8.13', api => {
      api.modifyClass('route:tags-index', {
        redirect() {
          //this.replaceWith(placeUrl(currentUser));
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
      });

      api.modifyClass('route:discovery', {
        redirect() {
          const path = window.location.pathname;
          if (path === "/" || path === "/categories") {
            DiscourseURL.routeTo(placeUrl(currentUser));
          }
        }
      });

      api.addDiscoveryQueryParam('match_tags', { refreshModel: true });
    });

    let discoveryTopicRoutes = [];

    let filters = site.get('filters');

    filters.push('top');
    filters.forEach(filter => {
      const filterCapitalized = filter.capitalize();
      discoveryTopicRoutes.push(filterCapitalized);
    });

    site.get('periods').forEach(period => {
      const periodCapitalized = period.capitalize();
      discoveryTopicRoutes.push(`Top${periodCapitalized}`);
    });

    discoveryTopicRoutes.forEach(function(route){
      var route = container.lookup(`route:discovery.${route}`);
      route.reopen({
        redirect() {
          return DiscourseURL.routeTo(placeUrl(currentUser));
        }
      });
    });
  }
};
