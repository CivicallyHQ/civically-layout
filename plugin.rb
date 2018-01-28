# name: civically-layout
# about: Handles layout and navigation for Civically
# version: 0.1
# authors: Angus McLeod
# url: https://github.com/civicallyhq/civically-layout

register_asset 'stylesheets/civically-layout.scss'

DiscourseEvent.on(:layouts_ready) do
  DiscourseLayouts::WidgetHelper.add_widget('civically-place', position: 'left', order: 'start')
  DiscourseLayouts::WidgetHelper.add_widget('civically-navigation', position: 'left', order: 'start')
  DiscourseLayouts::WidgetHelper.add_widget('civically-site', position: 'right', order: 'start')
  DiscourseLayouts::WidgetHelper.add_widget('civically-checklist', position: 'right', order: 'start')
  SiteSetting.layouts_sidebar_left_enabled_global = true
  SiteSetting.layouts_sidebar_right_enabled_global = true
  SiteSetting.layouts_sidebar_user_selected_widgets = true
  SiteSetting.layouts_list_navigation_disabled_global = true
  SiteSetting.layouts_list_header_disabled_global = true
  SiteSetting.layouts_mobile_enabled = true
end

DiscourseEvent.on(:locations_ready) do
  SiteSetting.location_topic_map = false
end

after_initialize do
  Category.register_custom_field_type('has_geojson', :boolean)
  add_to_serializer(:basic_category, :has_geojson) { object.custom_fields["has_geojson"] }
  add_to_serializer(:basic_category, :geojson) { object.custom_fields["geojson"] }
end
