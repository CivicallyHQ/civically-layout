# name: civically-navigation
# app: system
# about: Handles layout and navigation for Civically
# version: 0.1
# authors: Angus McLeod
# url: https://github.com/civicallyhq/civically-navigation

register_asset 'stylesheets/common/civically-navigation.scss'
register_asset 'stylesheets/mobile/civically-navigation.scss', :mobile

after_initialize do
  User.register_custom_field_type('pin_nav', :boolean)
  add_to_serializer(:current_user, :pin_nav) { object.pin_nav }

  class ::User
    def pin_nav
      ActiveModel::Type::Boolean.new.cast(custom_fields['pin_nav'])
    end
  end

  module ::CivicallyNavigation
    class Engine < ::Rails::Engine
      engine_name "civically_navigation"
      isolate_namespace CivicallyNavigation
    end
  end

  CivicallyNavigation::Engine.routes.draw do
    put "pin-nav" => "navigation#pin_nav"
  end

  Discourse::Application.routes.append do
    mount ::CivicallyNavigation::Engine, at: "navigation"
  end

  class CivicallyNavigation::NavigationController < ::ApplicationController
    def pin_nav
      params.require(:state)

      user = current_user

      user.custom_fields['pin_nav'] = params[:state]

      if user.save_custom_fields(true)
        render json: success_json
      else
        render json: failed_json
      end
    end
  end

  public_user_custom_fields = SiteSetting.public_user_custom_fields.split('|')
  public_user_custom_fields.push('pin_nav') unless public_user_custom_fields.include?('pin_nav')
  SiteSetting.public_user_custom_fields = public_user_custom_fields.join('|')
end
