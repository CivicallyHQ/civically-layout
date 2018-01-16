import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

createWidget('place-avatar', {
  tagName: 'div.place-avatar',

  html(attrs) {
    return h('img', { attributes: { src: attrs.avatarUrl }});
  },

  click() {
    this.sendWidgetAction('toggleList');
  }
});

export default createWidget('place-about', {
  tagName: 'div.place-about',
  buildKey: () => 'place-about',

  defaultState() {
    return {
      showList: false
    };
  },

  buildClasses(attrs, state) {
    let classes = 'place-about';
    if (state.showList) classes += ' list';
    return classes;
  },

  html(attrs, state) {
    const category = attrs.category;
    let avatarUrl = Discourse.SiteSettings.logo_small_url;

    if (category && category.uploaded_logo) {
      avatarUrl = category.uploaded_logo.url;
    }

    let contents = [this.attach('place-avatar', { avatarUrl })];

    if (state.showList) {
      if (category) {
        contents.push(...[
          h('div.about-list-title', category.name),
          this.attach('about-list', { category })
        ]);
      }
    }

    return contents;
  },

  toggleList() {
    this.state.showList = !this.state.showList;
  }
});
