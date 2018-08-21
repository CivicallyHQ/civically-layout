import MountWidget from 'discourse/components/mount-widget';
import { observes, on } from 'ember-addons/ember-computed-decorators';
import { getOwner } from 'discourse-common/lib/get-owner';

export default MountWidget.extend({
  router: Ember.inject.service('-routing'),
  currentRoute: Ember.computed.alias('router.router.currentRouteName'),
  widget: 'civically-path',

  buildArgs() {
    const category = this.get('category');
    const tags = this.get('tags');
    const loading = this.get('loading');
    const context = this.get('context');

    return {
      category,
      tags,
      loading,
      context
    };
  },

  @observes('category', 'tags', 'loading')
  triggerRerender() {
    this.queueRerender();
  },

  @on('init')
  @observes('currentRoute', 'router.router.currentState.routerJsState.fullQueryParams')
  routeWorkArounds() {
    const currentRoute = this.get('currentRoute');
    const queryParams = this.get('router.router.currentState.routerJsState.fullQueryParams');

    // necessary because the tags plugin outlet doesnt pass the category or the tag
    if (currentRoute.split('.')[0] === 'tags') {
      Ember.run.once(this, () => {
        const controller = getOwner(this).lookup('controller:tags-show');
        this.setProperties({
          category: controller.get('category'),
          tags: [controller.get('tag.id')]
        });
      });
    }

    if (currentRoute.toLowerCase().indexOf('category') > -1 && queryParams && queryParams['match_tags']) {
      Ember.run.once(this, () => {
        let matchTags = decodeURIComponent(queryParams['match_tags']);
        this.set('tags', matchTags.split(','));
      });
    }
  }
});
