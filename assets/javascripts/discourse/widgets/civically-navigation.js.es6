import { createWidget } from 'discourse/widgets/widget';

export default createWidget('civically-navigation', {
  tagName: 'div.widget-container.nav-container',
  buildKey: () => `civically-navigation`,

  defaultState() {
    return {
      locations: null
    };
  },

  getLocations() {
    const categories = this.site.get('categories').filter((c) => c.place && c.place_can_join);

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

  html(attrs, state) {
    const topic = attrs.topic;
    const category = attrs.category;
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

    let contents = [
      this.attach('map', mapOpts)
    ];

    if (attrs.editing) {
      contents.push(this.attach('app-edit', {
        side: attrs.side,
        index: attrs.index,
        name: 'civically-navigation',
        pinned: true
      }));
    }

    return contents;
  }
});
