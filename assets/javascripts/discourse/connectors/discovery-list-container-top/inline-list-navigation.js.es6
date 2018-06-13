export default {
  setupComponent(attrs, component) {
    Ember.run.scheduleOnce('afterRender', () => {
      const $listNavigation = $('.inline-list-navigation');
      const $container = $listNavigation.parent();
      $listNavigation.appendTo($container);
    });
  }
};
