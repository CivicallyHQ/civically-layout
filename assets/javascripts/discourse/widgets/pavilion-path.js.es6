import { createWidget } from 'discourse/widgets/widget';
import DiscourseURL from 'discourse/lib/url';
import { h } from 'virtual-dom';

createWidget('category-list-item', {
  tagName: 'li',

  html(attrs) {
    return h('span', attrs.category.name);
  },

  click() {
    this.sendWidgetAction('hideLists');
    DiscourseURL.routeTo(this.attrs.category.get('url'));
  }
});

export default createWidget('civically-path', {
  tagName: 'div.civically-path',
  buildKey: () => 'civically-path',

  defaultState() {
    const categoriesList = this.site.get('categoriesList');
    const parentCategories = categoriesList.filter(c => !c.get('parentCategory'));

    let state = {
      categoriesList,
      parentCategories,
      parentList: false,
      childList: false
    };

    return state;
  },

  buildTitle(type, name) {
    return this.attach('link', {
      action: 'showList',
      actionParam: type,
      title: name,
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
        headerContents.push(this.buildTitle('child', category.name));
      } else {
        headerContents.push(this.buildTitle('parent', category.name));
        if (category.has_children) {
          const label = I18n.t('categories.all_subcategories', {categoryName: category.name});
          headerContents.push(this.buildTitle('child', label));
        }
      }
    } else {
      headerContents.push(this.buildTitle('parent', I18n.t('categories.all')));
    }

    contents.push(h('div.widget-multi-title', headerContents));


    if (state.parentList) {
      const parentCategories = state.parentCategories;
      contents.push(this.buildList(parentCategories));
    }

    if (category && state.childList) {
      const parentCategory = category.get('parentCategory') || category;
      const categoriesList = state.categoriesList;
      const childCategories = categoriesList.filter(c => {
        return c.get('parentCategory.id') === parentCategory.id;
      });
      contents.push(this.buildList(childCategories));
    }

    return contents;
  },

  showList(type) {
    this.state[`${type}List`] = !this.state[`${type}List`];
    const opposite = type === 'parent' ? 'child' : 'parent';
    this.state[`${opposite}List`] = false;
    this.scheduleRerender();
  },

  hideLists() {
    this.state.parentList = false;
    this.state.childList = false;
    this.scheduleRerender();
  },

  buildList(categories) {
    return h('ul.category-dropdown', categories.map(category => {
      return this.attach('category-list-item', { category });
    }));
  },

  click() {
    this.hideLists();
  },

  clickOutside() {
    this.hideLists();
  }
});
