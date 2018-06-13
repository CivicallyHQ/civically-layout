import MountWidget from 'discourse/components/mount-widget';
import { observes, on } from 'ember-addons/ember-computed-decorators';
import { getOwner } from 'discourse-common/lib/get-owner';

export default MountWidget.extend({
  router: Ember.inject.service('-routing'),
  currentRoute: Ember.computed.alias('router.router.currentRouteName'),
  widget: 'civically-path',

  buildArgs() {
    const category = this.get('category');
    const tag = this.get('tag');
    const loading = this.get('loading');
    const context = this.get('context');

    return {
      category,
      tag,
      loading,
      context
    }
  },

  @observes('category', 'tag', 'loading')
  triggerRerender() {
    this.queueRerender();
  },

  // necessary because the tags plugin outlet doesnt pass the category or the tag
  @on('init')
  @observes('currentRoute')
  setTagCategory() {
    const currentRoute = this.get('currentRoute');
    if (currentRoute.split('.')[0] === 'tags') {
      Ember.run.once(this, () => {
        const controller = getOwner(this).lookup('controller:tags-show');
        this.setProperties({
          category: controller.get('category'),
          tag: controller.get('tag')
        });
      });
    }
  }
})
