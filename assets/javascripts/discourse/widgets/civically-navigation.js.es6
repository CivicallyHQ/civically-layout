import { createAppWidget } from 'discourse/plugins/civically-app/discourse/widgets/app-widget';
import Category from 'discourse/models/category';
import DiscourseURL from 'discourse/lib/url';
import { h } from 'virtual-dom';

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

    if (category && category.is_place) {
      let linkCategories = [];

      if (category.place_type === 'neighbourhood' || category.place_type === 'town') {
        const parentCategory = Category.findById(category.parent_category_id);
        linkCategories.push(parentCategory);
      }

      if (category.place_type === 'neighbourhood') {
        const grandparentCategory = Category.findById(category.parentCategory.parent_category_id);
        linkCategories.push(grandparentCategory);
      }

      let intCode = category.location.geo_location.international_code;

      if (intCode && category.slug !== intCode) {
        const internationalCategory = Category.findBySlug(intCode);
        linkCategories.push(internationalCategory);
      }

      if (linkCategories.length) {
        let placeLinks = [];

        linkCategories.forEach((c) => {
          placeLinks.push(h('li',
            this.attach('link', {
              className: 'place-link',
              action: 'goToPlace',
              actionParam: c,
              contents: () => {
                return [
                  this.attach('place-image', { category: c }),
                  h('a.place-name.p-link', c.place_name)
                ];
              }
            })
          ));
        });

        contents.push(h('ul.place-links', placeLinks));
      }
    }

    return contents;
  },

  goToPlace(category) {
    return DiscourseURL.routeTo(category.get('url'));
  }
});
