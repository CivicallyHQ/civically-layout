import { createWidget } from 'discourse/widgets/widget';
import DiscourseURL from 'discourse/lib/url';
import Category from 'discourse/models/category';
import RawHtml from 'discourse/widgets/raw-html';
import { getOwner } from 'discourse-common/lib/get-owner';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import { categoryTagPath } from '../lib/utilities';
import { iconNode } from 'discourse-common/lib/icon-library';
import { ajax } from 'discourse/lib/ajax';
import { cook } from 'discourse/lib/text';
import { h } from 'virtual-dom';

const formatFilter = function(filter) {
  return filter.charAt(0).toUpperCase() + filter.slice(1);
};

createWidget('category-list-item', {
  tagName: 'li',

  buildClasses(attrs) {
    let classes = '';
    if (attrs.addBorder) classes += 'add-border';
    return classes;
  },

  html(attrs) {
    const category = this.attrs.category;
    const label = category ? category.get('name') : this.attrs.label;
    return h('span', label);
  },

  click() {
    const category = this.attrs.category;
    const url = category ? category.get('url') : this.attrs.url;

    this.sendWidgetAction('hideLists');

    DiscourseURL.routeTo(url);
  }
});

createWidget('filter-list-item', {
  tagName: 'li',

  html(attrs) {
    return h('span', formatFilter(attrs.filter));
  },

  click() {
    this.sendWidgetAction('hideLists');
    const path = this.attrs.path;
    const isCategory = path.indexOf('/c/') > -1;
    const baseUrl = isCategory ? path.split('/l/')[0] + '/l/' : '/';
    const newUrl = baseUrl + this.attrs.filter;
    DiscourseURL.routeTo(newUrl);
  }
});

createWidget('tag-list-item', {
  tagName: 'li',

  html(attrs) {
    return h('span', attrs.tagId);
  },

  click() {
    this.sendWidgetAction('hideLists');
    const category = this.attrs.category;
    const filter = this.attrs.filter;
    const tagId = this.attrs.tagId;
    const tagPath = categoryTagPath(tagId, { category });

    let url = filter ? tagPath + '/l/' + filter : tagPath;

    DiscourseURL.routeTo(url);
  }
});

export default createWidget('civically-path', {
  tagName: 'div.civically-path',
  buildKey: () => 'civically-path',

  defaultState() {
    const allCategories = this.site.get('categoriesList');
    const currentUser = this.currentUser;

    let town;
    if (currentUser.town_category_id) {
      town = Category.findById(currentUser.town_category_id);
    }

    const firstCategories = allCategories.filter(c => {
      if (c.get('parentCategory') || c.get('isUncategorizedCategory')) return false;
      if (c.get('is_place')) {
        return town && town.parent_category_id === c.get('id');
      } else {
        return true;
      }
    });

    let firstIndex = firstCategories.findIndex(c => c.get('is_place'));
    firstCategories.splice(0, 0, firstCategories.splice(firstIndex, 1)[0]);

    return {
      allCategories,
      firstCategories,
      firstList: false,
      secondList: false,
      thirdList: false,
      filterList: false,
      tagList: false,
      show: currentUser.pin_nav,
      pinned: currentUser.pin_nav,
      pinSuccess: false,
      pinning: false
    };
  },

  buildTitle(type, name) {
    return this.attach('link', {
      action: 'showList',
      actionParam: type,
      rawTitle: name,
      rawLabel: name,
      className: `list-title ${name}`
    });
  },

  buildClasses() {
    let classes = '';
    const show = this.state.show;
    if (!show) classes += ' nav-hidden';
    return classes;
  },

  pin() {
    this.state.pinning = true;
    this.scheduleRerender();

    ajax('/navigation/pin-nav', {
      type: "PUT",
      data: {
        state: !this.state.pinned
      }
    }).catch(popupAjaxError).then((result) => {
      if (result.success) {
        this.state.pinSuccess = true;
        this.state.pinned = !this.state.pinned;
        Discourse.User.currentProp('pin_nav', true);
      }
    }).finally(() => {
      this.state.pinning = false;
      this.scheduleRerender();
    });
  },

  show() {
    this.state.show = true;
    this.scheduleRerender();
  },

  hide() {
    this.state.show = false;
    this.scheduleRerender();
  },

  html(attrs, state) {
    const user = this.currentUser;
    const townId = user.town_category_id;
    const neighbourhoodId = user.neighbourhood_category_id;

    if (!state.pinned && !state.show) {
      return this.attach('button', {
        className: 'show-nav',
        icon: 'list',
        title: 'user.navigation.show.title',
        action: 'show'
      });
    }

    const path = window.location.pathname;
    const allCategories = state.allCategories;

    const category = attrs.category;
    const tag = attrs.tag;

    let parentCategory;
    let grandparentCategory;

    if (category) {
      parentCategory =  category.get('parentCategory');

      if (parentCategory) {
        grandparentCategory = parentCategory.get('parentCategory');
      }
    }

    let first = grandparentCategory ? grandparentCategory : parentCategory ? parentCategory : category;
    let second = grandparentCategory ? parentCategory : first === parentCategory ? category : null;
    let third = grandparentCategory ? category : null;

    let firstIsPlace = first && first.is_place;
    let contents = [];
    let tagLists = [];
    let categoryLists = [];

    if (first) {
      categoryLists.push(this.buildTitle('first', first.name));

      if (second) {
        categoryLists.push(h('span', '>'));
        categoryLists.push(this.buildTitle('second', second.name));

        if (third) {
          categoryLists.push(h('span', '>'));
          categoryLists.push(this.buildTitle('third', third.name));
        } else if (second.has_children) {
          categoryLists.push(h('span', '>'));
          categoryLists.push(this.buildTitle('third', I18n.t('categories.all_subcategories', {
            categoryName: second.name
          })));
        }
      } else if (category.is_place || category.has_children) {
        categoryLists.push(h('span', '>'));
        categoryLists.push(this.buildTitle('second', I18n.t('categories.all_subcategories', {
          categoryName: first.name
        })));
      }
    } else {
      categoryLists.push(this.buildTitle('first', I18n.t('categories.all')));
    }

    if (state.firstList) {
      const firstCategories = state.firstCategories;
      categoryLists.push(this.buildCategoryList(firstCategories, firstIsPlace));
    }

    if (state.secondList) {
      const secondCategories = allCategories.filter(c => c.get('parentCategory.id') === first.id);

      if (firstIsPlace && townId) {
        let townIndex = secondCategories.findIndex(c => c.id === townId);
        secondCategories.splice(0, 0, secondCategories.splice(townIndex, 1)[0]);
      }

      categoryLists.push(this.buildCategoryList(secondCategories, firstIsPlace, first));
    }

    if (state.thirdList) {
      const thirdCategories = allCategories.filter(c => c.get('parentCategory.id') === second.id);

      if (firstIsPlace && neighbourhoodId) {
        let neighbourhoodIndex = thirdCategories.findIndex(c => c.id === neighbourhoodId);
        thirdCategories.splice(0, 0, thirdCategories.splice(neighbourhoodIndex, 1)[0]);
      }

      categoryLists.push(this.buildCategoryList(thirdCategories, firstIsPlace, second));
    }

    contents.push(h('span.category-lists', categoryLists));

    let filterLists = [];

    const hasFilter = path.indexOf('/l/') > -1;
    const filter = hasFilter ? path.split('/l/')[1] : 'latest';
    filterLists.push(h('span', '>'));
    filterLists.push(this.buildTitle('filter', formatFilter(filter)));

    if (state.filterList) {
      let filters = Array.from(new Set(this.site.get('filters')));
      filters = filters.filter((f) => f !== 'map');
      filterLists.push(this.buildFilterList(filters, path));
    }

    contents.push(h('span.filter-lists', filterLists));

    if (category && category.category_tags.length) {
      let label = tag ? tag.get('id') : I18n.t('tagging.selector_all_tags');
      tagLists.push(h('span', '>'));
      tagLists.push(this.buildTitle('tag', label));

      if (state.tagList) {
        tagLists.push(this.buildTagList(category.category_tags, category, filter));
      }

      contents.push(h('span.tag-lists', tagLists));
    }

    let displayControls = [];

    if (state.pinning) {
      displayControls.push(h('div.spinner'));
    } else if (state.pinSuccess) {
      const html = cook(I18n.t('user.navigation.pin.tip'));
      const tip = new RawHtml({ html: html.string });
      displayControls.push([
        iconNode('check'),
        h('span.tip', tip)
      ]);
    }

    if (!state.pinned && !state.pinning) {
      displayControls.push(...[
        this.attach('link', {
          action: "pin",
          className: 'pin-nav',
          icon: 'thumb-tack',
          title: 'user.navigation.pin.title'
        }),
        this.attach('link', {
          action: "hide",
          className: 'hide-nav',
          icon: 'times',
          title: 'user.navigation.hide.title'
        })
      ]);
    }

    contents.push(h('span.display-controls', displayControls));

    return h('div.widget-multi-title', contents);
  },

  showList(type) {
    this.state[`${type}List`] = !this.state[`${type}List`];
    ['first', 'second', 'third', 'filter', 'tag'].forEach((t) => {
      if (t !== type) this.state[`${t}List`] = false;
    });
    this.scheduleRerender();
  },

  hideLists() {
    this.state.firstList = false;
    this.state.secondList = false;
    this.state.thirdList = false;
    this.state.filterList = false;
    this.state.tagList = false;
    this.scheduleRerender();
  },

  buildCategoryList(categories, showBorder, parentCategory = null) {
    let list = categories.map((category, index) => {
      const addBorder = index === 0 && showBorder;
      return this.attach('category-list-item', { category, addBorder });
    });

    if (parentCategory) {
      list.unshift(this.attach('category-list-item', {
        label: I18n.t('categories.all_subcategories', { categoryName: parentCategory.name }),
        url: parentCategory.get('url')
      }));
    }

    return h('ul.nav-dropdown', list);
  },

  buildFilterList(filters, path) {
    return h('ul.nav-dropdown', filters.map(filter => {
      return this.attach('filter-list-item', { filter, path });
    }));
  },

  buildTagList(tags, category, filter) {

    if (!tags || !tags.length) return null;

    const catUrl = category.get('url');
    let allUrl = filter ? catUrl + '/l/' + filter : catUrl

    let list = [this.attach('category-list-item', {
      label: I18n.t('tagging.selector_all_tags'),
      url: allUrl
    })];

    list.push(...tags.map(tagId => {
      return this.attach('tag-list-item', { tagId, category, filter });
    }));

    return h('ul.nav-dropdown', list);
  },

  closeTip() {
    if (this.state.pinSuccess) {
      this.state.pinSuccess = false;
      this.scheduleRerender();
    }
  },

  click() {
    if (this.state.show) {
      this.hideLists();
    }

    this.closeTip();
  },

  clickOutside() {
    this.hideLists();
    this.closeTip();
  }
});
