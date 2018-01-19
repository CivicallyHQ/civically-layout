import { createWidget } from 'discourse/widgets/widget';
import DiscourseURL from 'discourse/lib/url';
import { h } from 'virtual-dom';

createWidget('category-list-item', {
  tagName: 'li',

  buildClasses(attrs) {
    let classes = '';
    if (attrs.firstPlace) {
      classes += 'first-place';
    }
    return classes;
  },

  html(attrs) {
    return h('span', attrs.category.name);
  },

  click() {
    const categoryUrl = this.attrs.category.get('url');
    this.sendWidgetAction('hideLists');
    DiscourseURL.routeTo(categoryUrl);
  }
});

createWidget('filter-list-item', {
  tagName: 'li',

  html(attrs) {
    return h('span', attrs.filter);
  },

  click() {
    this.sendWidgetAction('hideLists');
    const path = this.attrs.path;
    const hasFilter = path.indexOf('/l/') > -1;
    const baseUrl = hasFilter ? path.split('/l/')[0] : path;
    const newUrl = baseUrl + '/l/' + this.attrs.filter;
    DiscourseURL.routeTo(newUrl);
  }
});

export default createWidget('civically-path', {
  tagName: 'div.civically-path',
  buildKey: () => 'civically-path',

  defaultState() {
    const categoriesList = this.site.get('categoriesList');
    const parentCategories = categoriesList.filter(c => {
      const parentCategory = c.get('parentCategory');
      const isUncategorizedCategory = c.get('isUncategorizedCategory');
      return !parentCategory && !isUncategorizedCategory;
    });

    let state = {
      categoriesList,
      parentCategories,
      parentList: false,
      childList: false,
      filterList: false,
    };

    return state;
  },

  buildTitle(type, name) {
    return this.attach('link', {
      action: 'showList',
      actionParam: type,
      rawTitle: name,
      rawLabel: name,
      className: 'list-title p-link'
    });
  },

  html(attrs, state) {
    const category = attrs.category;
    let contents = [];
    let headerContents = [];

    if (category) {
      const parentCategory = category.get('parentCategory');

      if (parentCategory) {
        headerContents.push(this.buildTitle('parent', parentCategory.name));
        headerContents.push(h('span', '>'));
        headerContents.push(this.buildTitle('child', category.name));
      } else {
        headerContents.push(this.buildTitle('parent', category.name));
        if (category.has_children) {
          headerContents.push(h('span', '>'));
          const label = I18n.t('categories.all_subcategories', {categoryName: category.name});
          headerContents.push(this.buildTitle('child', label));
        }
      }
    } else {
      headerContents.push(this.buildTitle('parent', I18n.t('categories.all')));
    }

    const path = window.location.pathname;
    const hasFilter = path.indexOf('/l/') > -1;
    const filter = hasFilter ? path.split('/l/')[1] : 'latest';
    headerContents.push(h('span', '>'));
    headerContents.push(this.buildTitle('filter', filter));

    contents.push(h('div.widget-multi-title', headerContents));

    if (state.parentList) {
      const parentCategories = state.parentCategories;
      contents.push(this.buildCategoryList(parentCategories, true));
    }

    if (category && state.childList) {
      const parentCategory = category.get('parentCategory') || category;
      const categoriesList = state.categoriesList;
      const childCategories = categoriesList.filter(c => {
        return c.get('parentCategory.id') === parentCategory.id;
      });
      contents.push(this.buildCategoryList(childCategories));
    }

    if (state.filterList) {
      let filters = Array.from(new Set(this.site.get('filters')));
      filters = filters.filter((f) => f !== 'map');
      contents.push(this.buildFilterList(filters, path));
    }

    return contents;
  },

  showList(type) {
    this.state[`${type}List`] = !this.state[`${type}List`];
    ['parent', 'child', 'filter'].forEach((t) => {
      if (t !== type) this.state[`${t}List`] = false;
    });
    this.scheduleRerender();
  },

  hideLists() {
    this.state.parentList = false;
    this.state.childList = false;
    this.state.filterList = false;
    this.scheduleRerender();
  },

  buildCategoryList(categories, parent) {
    let notReachedPlace = true;
    return h('ul.category-dropdown', categories.map(category => {
      const firstPlace = notReachedPlace && category.place && parent;
      if (firstPlace) notReachedPlace = false;
      return this.attach('category-list-item', { category, firstPlace });
    }));
  },

  buildFilterList(filters, path) {
    return h('ul.category-dropdown', filters.map(filter => {
      return this.attach('filter-list-item', { filter, path });
    }));
  },

  click() {
    this.hideLists();
  },

  clickOutside() {
    this.hideLists();
  }
});
