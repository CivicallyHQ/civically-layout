# name: civically-navigation
# app: system
# about: Handles layout and navigation for Civically
# version: 0.1
# authors: Angus McLeod
# url: https://github.com/civicallyhq/civically-navigation

register_asset 'stylesheets/common/civically-navigation.scss'
register_asset 'stylesheets/mobile/civically-navigation.scss', :mobile

DiscourseEvent.on(:layouts_ready) do
  SiteSetting.layouts_sidebar_left_enabled_global = true
  SiteSetting.layouts_sidebar_right_enabled_global = true
  SiteSetting.layouts_list_navigation_disabled_global = true
  SiteSetting.layouts_list_header_disabled_global = true
  SiteSetting.layouts_hide_sidebars_if_empty = true
  SiteSetting.layouts_mobile_enabled = true
  SiteSetting.layouts_sidebar_left_fixed = false
  SiteSetting.layouts_sidebar_right_fixed = false
end

DiscourseEvent.on(:locations_ready) do
  SiteSetting.location_topic_map = false
end
