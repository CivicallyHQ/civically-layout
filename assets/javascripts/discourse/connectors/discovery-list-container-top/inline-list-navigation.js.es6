export default {
  setupComponent() {
    Ember.run.scheduleOnce('afterRender', () => {
      const $listNavigation = $('.inline-list-navigation');
      const $container = $listNavigation.parent();
      $listNavigation.appendTo($container);
    });
  }
};
