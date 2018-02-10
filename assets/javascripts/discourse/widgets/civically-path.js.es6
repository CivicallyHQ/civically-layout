import { createWidget } from 'discourse/widgets/widget';
import DiscourseURL from 'discourse/lib/url';
import Category from 'discourse/models/category';
import { h } from 'virtual-dom';

createWidget('category-list-item', {
  tagName: 'li',

  buildClasses(attrs) {
    let classes = '';
    if (attrs.addBorder) {
      classes += 'add-border';
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
    const currentUser = this.currentUser;
    const placeCategoryId = currentUser.place_category_id;
    const parentCategories = categoriesList.filter(c => {
      const hasParent = c.get('parentCategory');
      const isUncategorizedCategory = c.get('isUncategorizedCategory');
      if (hasParent || isUncategorizedCategory) return false;

      const isPlace = c.get('place');
      if (isPlace) {
        if (!placeCategoryId) return false;

        const parentCategoryId = c.get('id');
        const place = Category.findById(placeCategoryId);
        return place.parent_category_id === parentCategoryId;
      }

      return true;
    });

    parentCategories.reverse();

    return {
      categoriesList,
      parentCategories,
      parentList: false,
      childList: false,
      filterList: false,
    };
  },

  buildTitle(type, name) {
    return this.attach('link', {
      action: 'showList',
      actionParam: type,
      rawTitle: name,
      rawLabel: name,
      className: 'list-title'
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
      const userPlaceIsSet = Boolean(this.currentUser.place_category_id);
      contents.push(this.buildCategoryList(parentCategories, userPlaceIsSet));
    }

    if (category && state.childList) {
      const parentCategory = category.get('parentCategory') || category;
      const categoriesList = state.categoriesList;
      const childCategories = categoriesList.filter(c => {
        return c.get('parentCategory.id') === parentCategory.id;
      });
      const placeCategoryId = this.currentUser.place_category_id;
      if (placeCategoryId) {
        const placeIndex = childCategories.findIndex(c => c.id === placeCategoryId);
        childCategories.splice(0, 0, childCategories.splice(placeIndex, 1)[0]);
      }
      const parentIsPlace = parentCategory.get('place');
      contents.push(this.buildCategoryList(childCategories, parentIsPlace));
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

  buildCategoryList(categories, showBorder) {
    return h('ul.category-dropdown', categories.map((category, index) => {
      const addBorder = index === 0 && showBorder;
      return this.attach('category-list-item', { category, addBorder });
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
