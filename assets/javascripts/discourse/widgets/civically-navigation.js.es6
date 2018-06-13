import { createAppWidget } from 'discourse/plugins/civically-app/discourse/widgets/app-widget';
import Category from 'discourse/models/category';

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
    const categories = this.site.get('categories');
    const places = categories.filter((c) => c.is_place);
    let locations = places.map((p) => p.location);

    const category = this.attrs.category;
    const filter = 'c/' + Category.slugFor(category) + '/l/petitions';
    this.store.findFiltered('topicList', { filter }).then((list) => {
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
    const extraWidgets = [{ widget: 'place-about', attrs: { category }}];
    const locations = this.state.locations;
    const runSetup = this.state.runSetup;

    if (!locations) {
      this.getLocations();
    }

    const mapOpts = {
      topic,
      category,
      extraWidgets,
      showAvatar: false,
      search: true,
      locations,
      runSetup,
      zoom: 0
    };

    this.state.runSetup = false;

    let contents = [ this.attach('map', mapOpts) ];

    return contents;
  }
});
