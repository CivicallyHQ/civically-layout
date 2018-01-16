import { createWidget } from 'discourse/widgets/widget';
import Category from 'discourse/models/category';
import DiscourseURL from 'discourse/lib/url';
import { h } from 'virtual-dom';

createWidget('map-category-search-item', {
  tagName: 'li',

  html(attrs) {
    return attrs.category.name;
  },

  click() {
    this.sendWidgetAction('goToCategory', this.attrs.category);
  }
});

createWidget('map-category-search-input', {
  tagName: 'input',
  buildId: () => 'map-category-search-input',
  buildKey: () => 'map-category-search-input',

  defaultCategory() {
    const category = this.attrs.category;
    return category.place ? category : null;
  },

  defaultState() {
    const defaultCategory = this.defaultCategory();
    return {
      category: defaultCategory
    };
  },

  buildClasses(attrs) {
    if (attrs.listVisible) return 'list-visible';
  },

  buildAttributes() {
    const defaultCategory = this.defaultCategory();
    return {
      type: 'text',
      value: defaultCategory ? defaultCategory.name : '',
      placeholder: I18n.t('map.search_placeholder')
    };
  },

  click() {
    this.sendWidgetAction('toggleList', true);
  },

  keyDown(e) {
    this.sendWidgetAction('toggleList', true);
    if (e.which === 9) {
      e.preventDefault();
      return this.sendWidgetAction('autoComplete');
    }
  },

  clickOutside() {
    this.sendWidgetAction('toggleList', false);
  },

  keyUp(e) {
    if (e.which === 13) {
      let category = this.state.category;

      if (this.attrs.topResult) {
        category = this.attrs.topResult;
      }

      this.sendWidgetAction('toggleList', false);
      return this.sendWidgetAction('goToCategory', category);
    }

    this.sendWidgetAction('inputChanged', e.target.value);
  }
});

export default createWidget('map-category-search', {
  tagName: 'div.map-category-search',
  buildKey: () => 'map-category-search',

  defaultState(attrs) {
    const input = attrs.category ? attrs.category.name : '';
    return {
      category: attrs.category,
      categories: this.filteredCategories(input),
      listVisible: false
    };
  },

  filteredCategories(input) {
    const categories = Category.list().filter((c) => c.place);
    return categories.filter((c) => {
      const name = c.get('name').toLowerCase();
      return name.indexOf(input.toLowerCase()) > -1;
    }).slice(0,8);
  },

  getCategoryList() {
    let options = [];
    this.state.categories.forEach((c) => {
      options.push(this.attach('map-category-search-item', {
        category: c
      }));
    });
    return options;
  },

  html(attrs, state) {
    const category = state.category || attrs.category || {};

    let contents = [
      this.attach('map-category-search-input', {
        category,
        listVisible: state.listVisible,
        topResult: state.categories[0] || false
      })
    ];

    if (state.listVisible) {
      contents.push(
        h('ul.nav-category-list', this.getCategoryList())
      );
    }

    return contents;
  },

  inputChanged(value) {
    this.state.categories = this.filteredCategories(value);
  },

  autoComplete() {
    $("#map-category-search-input").val(this.state.categories[0].name);
  },

  toggleList(visible) {
    this.state.listVisible = visible;
  },

  goToCategory(category) {
    this.state.category = category;
    const node = document.getElementById('#map-category-search-input');
    if (node) {
      node.value = category.name;
    }
    DiscourseURL.routeTo(category.get('url'));
  }
});
