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
    const topic = this.attrs.topic;
    const filter = 'c/petitions/place';
    this.store.findFiltered('topicList', { filter }).then((list) => {
      list.topics.forEach((t) => {
        if ((!topic || t.id !== topic.id) && t.location) {
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
      categorySearch: true,
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
