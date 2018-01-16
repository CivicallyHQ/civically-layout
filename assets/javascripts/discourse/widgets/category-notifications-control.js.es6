import { createWidget } from 'discourse/widgets/widget';
import { allLevels, buttonDetails } from 'discourse/lib/notification-levels';
import { h } from 'virtual-dom';
import RawHTML from 'discourse/widgets/raw-html';

createWidget('category-notification-option', {
  buildKey: attrs => `category-notifications-button-${attrs.id}`,
  tagName: 'li',

  html(attrs) {
    return h('a', [
      h('span.icon', { className: `fa fa-${attrs.icon} ${attrs.key}`}),
      h('div', [
        h('span.title', I18n.t(`category.notifications.${attrs.key}.title`)),
        h('span', I18n.t(`category.notifications.${attrs.key}.description`)),
      ])
    ]);
  },

  click() {
    this.sendWidgetAction('notificationLevelChanged', this.attrs.id);
  }
});

export default createWidget('category-notifications-control', {
  tagName: 'span.notification-options',
  buildKey: () => 'category-notifications-control',

  defaultState() {
    return { expanded: false };
  },

  buildClasses(attrs, state) {
    if (state && state.expanded) { return "open"; }
  },

  linkFor(level) {
    const details = buttonDetails(level);

    return this.attach('link', {
      label: `category.notifications.${details.key}.title`,
      icon: details.icon,
      action: 'toggleDropdown',
      iconClass: details.key
    });
  },

  html(attrs, state) {
    const category = attrs.category;
    const result = [ this.linkFor(category.notification_level) ];

    if (state && state.expanded) {
      result.push(h('ul.dropdown-menu', allLevels.map(l => this.attach('category-notification-option', l))));
    }

    if (attrs.appendReason) {
      result.push(new RawHTML({ html: `<p>${details.get('notificationReasonText')}</p>` }));
    }

    return result;
  },

  toggleDropdown() {
    this.state.expanded = !this.state.expanded;
  },

  clickOutside() {
    if (this.state && this.state.expanded) {
      this.sendWidgetAction('toggleDropdown');
    }
  },

  notificationLevelChanged(id) {
    this.state.expanded = false;
    return this.attrs.category.setNotification(id);
  },

  topicNotificationsButtonKeyboardTrigger(msg) {
    switch(msg.type) {
      case 'notification':
        this.notificationLevelChanged(msg.id);
        break;
    }
  }
});
