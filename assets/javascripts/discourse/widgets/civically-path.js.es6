import { createWidget } from 'discourse/widgets/widget';
import DiscourseURL from 'discourse/lib/url';
import Category from 'discourse/models/category';
import RawHtml from 'discourse/widgets/raw-html';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import { iconNode } from 'discourse-common/lib/icon-library';
import { ajax } from 'discourse/lib/ajax';
import { cook } from 'discourse/lib/text';
import { h } from 'virtual-dom';
import { resourceLink } from 'discourse/plugins/civically-resources/discourse/lib/resource-utilities';

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
    const category = attrs.category;
    const label = category ? category.get('name') : attrs.label;
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
    const tag = this.attrs.tagId.replace(' ', '_');
    let tags = this.attrs.tags || [];

    if (tags.indexOf(tag) === -1) {
      tags.push(tag);
      this.sendWidgetAction('transitionToTags', tags);
    }
  }
});

export default createWidget('civically-path', {
  tagName: 'div.civically-path',
  buildKey: () => 'civically-path',

  defaultState(attrs) {
    const allCategories = this.site.get('categoriesList');
    const currentUser = this.currentUser;

    let town;
    let internationalCode;

    if (currentUser.town_category_id) {
      town = Category.findById(currentUser.town_category_id);

      if (town.location) {
        internationalCode = town.location.geo_location.international_code;
      }
    }

    let firstCategories = allCategories.filter(c => {
      if (c.get('parentCategory') || c.get('isUncategorizedCategory')) return false;
      if (c.get('is_place')) {
        return town &&
               (town.parent_category_id === c.get('id') ||
                c.get('slug') === internationalCode ||
                c.get('slug') === 'world');
      } else {
        return true;
      }
    }).sort((a) => a.get('is_place') ? -1 : 1);

    firstCategories.forEach((c, i) => {
      if (c.get('is_place')) {
        let insertAt;

        if (town.parent_category_id === c.get('id')) {
          insertAt = 0;
        } else if (internationalCode) {
          insertAt = c.get('slug') === internationalCode ? 1 : 2;
        } else {
          insertAt = 1;
        }

        firstCategories.splice(insertAt, 0, firstCategories.splice(i, 1)[0]);
      }
    });

    if (Discourse.SiteSettings.invite_only) {
      firstCategories = [firstCategories[0]];
    }

    return {
      allCategories,
      firstCategories,
      tags: attrs.tags,
      firstList: null,
      secondList: null,
      thirdList: null,
      filterList: null,
      tagList: null,
      show: currentUser.pin_nav,
      pinned: currentUser.pin_nav,
      pinSuccess: false,
      pinning: false,
      internationalCode
    };
  },

  buildTitle(type, name, opts = {}) {
    let actionParam = {
      type
    };

    if (opts.listType) {
      actionParam['listType'] = opts.listType;
    }

    return this.attach('link', {
      action: 'showList',
      actionParam,
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
    const tags = state.tags || attrs.tags;

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

    if (first) {
      let firstList = [];

      firstList.push(this.buildTitle('first', first.name));

      if (state.firstList) {
        firstList.push(this.buildCategoryList(
          state.firstCategories,
          firstIsPlace,
          null,
          state.internationalCode
        ));
      }

      contents.push(h('span.first-list', firstList));

      const secondCategories = allCategories.filter(c => c.get('parentCategory.id') === first.id);

      if (firstIsPlace && townId) {
        let townIndex = secondCategories.findIndex(c => c.id === townId);

        if (townIndex !== -1) {
          secondCategories.splice(0, 0, secondCategories.splice(townIndex, 1)[0]);
        }
      }

      if (second) {
        let secondList = [];

        secondList.push(h('span', '>'));
        secondList.push(this.buildTitle('second', second.name));

        if (state.secondList) {
          secondList.push(this.buildCategoryList(secondCategories, firstIsPlace, first));
        }

        contents.push(h('span.second-list', secondList));

        let thirdList = [];

        if (third) {
          thirdList.push(h('span', '>'));
          thirdList.push(this.buildTitle('third', third.name));
        } else if (second.has_children) {
          thirdList.push(h('span', '>'));
          thirdList.push(this.buildTitle('third', this.allLabel(firstIsPlace, second.name)));
        }

        if (state.thirdList) {
          const thirdCategories = allCategories.filter(c => c.get('parentCategory.id') === second.id);

          if (firstIsPlace && neighbourhoodId) {
            let neighbourhoodIndex = thirdCategories.findIndex(c => c.id === neighbourhoodId);
            thirdCategories.splice(0, 0, thirdCategories.splice(neighbourhoodIndex, 1)[0]);
          }

          thirdList.push(this.buildCategoryList(thirdCategories, firstIsPlace, second));
        }

        if (thirdList.length > 0) {
          contents.push(h('span.third-list', thirdList));
        }
      } else if (category.is_place || category.has_children) {
        let secondList = [];

        secondList.push(h('span', '>'));
        secondList.push(this.buildTitle('second', this.allLabel(firstIsPlace, first.name)));

        if (state.secondList) {
          secondList.push(this.buildCategoryList(secondCategories, firstIsPlace, first));
        }

        contents.push(h('span.second-list', secondList));
      }
    } else {
      let firstList = [];

      firstList.push(this.buildTitle('first', I18n.t('categories.all')));

      if (state.firstList) {
        firstList.push(this.buildCategoryList(
          state.firstCategories,
          firstIsPlace,
          null,
          state.internationalCode
        ));
      }

      contents.push(h('span.first-list', firstList));
    }

    let filterLists = [];

    const hasFilter = path.indexOf('/l/') > -1;
    const filter = hasFilter ? path.split('/l/')[1] : 'latest';
    filterLists.push(h('span', '>'));
    filterLists.push(this.buildTitle('filter', formatFilter(filter)));

    let excludedFilters = ['map'];

    if (Discourse.SiteSettings.invite_only) {
      excludedFilters.push(...['petitions', 'agenda', 'calendar', 'ratings', 'votes', 'top']);
    }

    if (state.filterList) {
      let filters = Array.from(new Set(this.site.get('filters')));
      filters = filters.filter((f) => excludedFilters.indexOf(f) === -1);
      filterLists.push(this.buildFilterList(filters, path));
    }

    contents.push(h('span.filter-lists', filterLists));

    tagLists.push(h('span', '>'));

    const civicallyTags = this.site.get('civically_tags');

    Object.keys(civicallyTags).forEach(group => {
      let currentTag;

      if (tags && tags.length) {
        currentTag = tags.find(t => civicallyTags[group].indexOf(t) > -1);
      }

      if (currentTag) {
        tagLists.push([
          this.buildTitle('tag', currentTag, { listType: group }),
          this.attach('link', {
            action: 'removeTag',
            actionParam: currentTag,
            icon: 'times'
          })
        ]);
      } else {
        tagLists.push(this.buildTitle(
          'tag',
          I18n.t('tagging.all_of_group', { group }),
          { listType: group })
        );
      }
    });

    if (state.tagList) {
      tagLists.push(this.buildTagList(civicallyTags[state.tagList], tags, category, filter, state.tagList));
    }

    contents.push(h('span.tag-lists', tagLists));

    if (tags && tags.length > 1) {
      let linkHtml = new RawHtml({ html: resourceLink({
        category,
        tags
      })});
      contents.push(h('span.nav-resource-link', linkHtml));
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

  removeTag(tag) {
    const location = window.location;
    const path = location.pathname;
    const query = location.search;
    let tags = [];

    if (query.indexOf('match_tags') > -1) {
      let tagString = query.match(/match_tags=(.*)/)[1];
      if (tagString) {
        tags = decodeURIComponent(tagString).split(',');
      }
    } else if (path.indexOf('/tags/') > -1) {
      tags = path.split('/');
    }

    tags = tags.filter((t) => t !== tag);

    this.transitionToTags(tags);
  },

  transitionToTags(tags) {
    this.state.tags = tags;
    this.scheduleRerender();
    const router = DiscourseURL.get("router._routerMicrolib");

    let queryParams = {};

    if (tags && tags.length) {
      queryParams['match_tags'] = tags.join(',');
    }

    router.transitionTo({ queryParams });
  },

  showList(opts) {
    if (opts.listType) {
      if (this.state[`${opts.type}List`] === opts.listType) {
        this.state[`${opts.type}List`] = null;
      } else {
        this.state[`${opts.type}List`] = opts.listType;
      }
    } else {
      this.state[`${opts.type}List`] = !this.state[`${opts.type}List`];
    }

    ['first', 'second', 'third', 'filter', 'tag'].forEach((t) => {
      if (t !== opts.type) this.state[`${t}List`] = null;
    });

    this.scheduleRerender();
  },

  hideLists() {
    this.state.firstList = null;
    this.state.secondList = null;
    this.state.thirdList = null;
    this.state.filterList = null;
    this.state.tagList = null;
    this.scheduleRerender();
  },

  buildCategoryList(categories, firstIsPlace, parentCategory = null, internationalCode = null) {
    let borderIndex = (!parentCategory && internationalCode) ? 2 : 1;

    let list = categories.map((category, index) => {
      const addBorder = index === borderIndex && firstIsPlace;
      return this.attach('category-list-item', { category, addBorder });
    });

    if (parentCategory) {
      let label = this.allLabel(firstIsPlace, parentCategory.name);

      list.unshift(this.attach('category-list-item', {
        label,
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

  buildTagList(tagList, tags, category, filter, group) {

    if (!tagList || !tagList.length) return null;

    const catUrl = category.get('url');
    let allUrl = filter ? catUrl + '/l/' + filter : catUrl;

    let list = [this.attach('category-list-item', {
      label: I18n.t('tagging.all_of_group', { group }),
      url: allUrl
    })];

    list.push(...tagList.map(tagId => {
      return this.attach('tag-list-item', { tagId, tags, category, filter });
    }));

    return h('ul.nav-dropdown', list);
  },

  allLabel(firstIsPlace, parentName) {
    return firstIsPlace ? I18n.t('place.all_towns') :
      I18n.t('categories.all_subcategories', { categoryName: parentName });
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
