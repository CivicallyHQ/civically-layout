import { ajax } from 'discourse/lib/ajax';
import { h } from 'virtual-dom';

const buildTitle = function(context, parent, type) {
  const currentType = context.state.currentType;
  const active = currentType === type;

  let classes = 'list-title';
  if (active) classes += ' active';

  let contents = [h('span', I18n.t(`${parent}.${type}.title`))];

  const user = context.currentUser;
  if (user && user.unread_lists) {
    const hasUnread = user.unread_lists.indexOf(type) > -1;
    if (hasUnread) {
      classes += ' unread';
      contents.push(h('a.badge.badge-notification.new-topic'));
    }
  }

  let attrs = {
    action: 'showList',
    actionParam: type,
    title: `${parent}.${type}.help`,
    contents: () => contents ,
    className: classes
  };

  return context.attach('link', attrs);
};

const clearUnreadList = function(context, type) {
  const user = context.currentUser;
  const unreadLists = user.unread_lists;
  const index = unreadLists.indexOf(type);
  if (index > -1) {
    unreadLists.splice(index, 1);
    user.set('unread_lists', unreadLists);
    context.scheduleRerender();

    ajax(`/c-user/${user.username}/unread-list`, {
      type: "DELETE",
      data: {
        list: type
      }
    });
  }
};

export { buildTitle, clearUnreadList };
