import { createWidget } from 'discourse/widgets/widget';
import showModal from 'discourse/lib/show-modal';
import { formatNum } from 'discourse/plugins/civically-place/discourse/lib/place-utilities';
import { h } from 'virtual-dom';

createWidget('about-list-item', {
  tagName: 'li',

  html(attrs) {
    return [
      h('span', I18n.t(`place.${attrs.key}.label`)),
      h('span', ': '),
      h('span', `${attrs.value}`)
    ];
  }
});

export default createWidget('about-list', {
  tagName: 'div.widget-list.about-list',

  html(attrs) {
    const category = attrs.category;
    if (!category) return [];

    const user = this.currentUser;
    let list = [];

    const isPlace = category.get('place');
    if (isPlace) {
      const userCount = category.get('place_user_count');
      list.push(this.attach('about-list-item', {
        key: 'user_count',
        value: formatNum(userCount)
      }));

      let electionList = [this.attach('election-list', { category })];
      if (user.staff) {
        electionList.push(this.attach('link', {
          icon: 'plus',
          action: 'createElection',
          className: 'create-election-link'
        }));
      }
      list.push(h('li', electionList));

      const modString = category.get('moderators');
      if (modString) {
        const mods = modString.split(',');
        let modList = [h('span', `${I18n.t('place.moderator.list_label')}: `)];
        mods.forEach((username, i) => {
          modList.push(this.attach('link', {
            className: 'mention',
            contents: () => `@${username}`
          }));
          if (i < mods.length - 1) {
            modList.push(', ');
          }
        });
        list.push(h('li', modList));
      }
    };

    if (user && category) {
      list.push(h('li', [
        h('span', `${I18n.t('place.notifications.label')}: `),
        this.attach('category-notifications-control', {
          showFullTitle: true,
          category
        })
      ]));
    }

    return h('ul', list);
  },

  createElection() {
    showModal('create-election', {
      model: {
        categoryId: this.attrs.category.id
      }
    });
  }
});
