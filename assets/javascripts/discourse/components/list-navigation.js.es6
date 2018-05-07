import MountWidget from 'discourse/components/mount-widget';
import { observes } from 'ember-addons/ember-computed-decorators';

export default MountWidget.extend({
  widget: 'civically-path',

  buildArgs() {
    const category = this.get('category');
    const loading = this.get('loading');
    const context = this.get('context');

    return {
      category,
      loading,
      context
    }
  },

  @observes('category', 'loading')
  triggerRerender() {
    this.queueRerender();
  }
})
