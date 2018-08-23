import { ajax } from 'discourse/lib/ajax';
import { h } from 'virtual-dom';

const buildTitle = function(context, parent, type) {
  const currentListType = context.state.currentListType;
  const active = currentListType === type;

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

const renderCategoryTags = function(topic, params){
  let tags = topic.tags;
  let buffer = "";
  let tagsForUser = null;
  let category = null;
  const isPrivateMessage = topic.get('isPrivateMessage');

  if (params) {
    if (params.mode === "list") {
      tags = topic.get("visibleListTags");
    }
    if (params.tagsForUser) {
      tagsForUser = params.tagsForUser;
    }
    if (topic.category) {
      category = topic.category;
    }
  }

  if (tags && tags.length > 0) {
    buffer = "<div class='discourse-tags'>";
    if (tags) {
      for(let i=0; i<tags.length; i++){
        buffer += renderCategoryTag(tags[i], { isPrivateMessage, tagsForUser, category }) + ' ';
      }
    }

    buffer += "</div>";
  }

  return buffer;
};

const categoryTagPath = function(tag, params) {
  let path;

  if (params.isPrivateMessage && Discourse.User.current()) {
    const username = params.tagsForUser ? params.tagsForUser : Discourse.User.current().username;
    path = `/u/${username}/messages/tags/${tag}`;
  } else if (params.category) {
    const categoryUrl = params.category.get('url');
    path = `/tags${categoryUrl}/${tag}`;
  } else {
    path = `/tags/${tag}`;
  }

  return path;
};

const renderCategoryTag = function(tag, params) {
  params = params || {};
  tag = Handlebars.Utils.escapeExpression(tag);
  const classes = ['tag-' + tag, 'discourse-tag'];
  const tagName = params.tagName || "a";
  let path;

  if (tagName === "a" && !params.noHref) {
    path = categoryTagPath(tag, params);
  }
  const href = path ? ` href='${Discourse.getURL(path)}' ` : "";

  if (Discourse.SiteSettings.tag_style || params.style) {
    classes.push(params.style || Discourse.SiteSettings.tag_style);
  }

  let val = "<" + tagName + href + " class='" + classes.join(" ") + "'>" + tag + "</" + tagName + ">";

  if (params.count) {
    val += " <span class='discourse-tag-count'>x" + params.count + "</span>";
  }

  return val;
};

const tagGroup = function(tag) {
  const civicallyTags = Discourse.currentProp('civically_tags');
  return Object.keys(civicallyTags).find((g) => civicallyTags[g].indexOf(tag) > -1);
};

export { buildTitle, clearUnreadList, renderCategoryTags, renderCategoryTag, categoryTagPath, tagGroup };
