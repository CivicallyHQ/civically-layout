import { createAppWidget } from 'discourse/plugins/civically-app/discourse/widgets/app-widget';

export default createAppWidget('civically-navigation', {
  defaultState() {
    return {
      locations: null
    };
  },

  buildClasses() {
    return 'nav-container';
  },

  getLocations() {
    const categories = this.site.get('categories').filter((c) => {
      c.is_place && c.can_join
    });

    let locations = categories.reduce((ls, c) => {
      if (c.location) {
        ls.push(c.location);
      };
      return ls;
    }, []);

    this.store.findFiltered('topicList', { filter: 'c/petitions/place' }).then((list) => {
      list.topics.forEach((t) => {
        if (t.location) {
          locations.push(t.location);
        }
      });
      this.state.locations = locations;
      this.state.runSetup = true;
      this.scheduleRerender();
    });
  },

  contents() {
    const { topic, category, } = this.attrs;
    const state = this.state;
    const extraWidgets = [{ widget: 'place-about', attrs: { category }}];

    if (!state.locations) {
      this.getLocations();
    }

    const mapOpts = {
      topic,
      category,
      extraWidgets,
      showAvatar: false,
      search: true,
      locations: state.locations,
      runSetup: state.runSetup,
      zoom: 0
    };

    state.runSetup = false;

    let contents = [ this.attach('map', mapOpts) ];

    return contents;
  }
});
