import { registerUnbound } from 'discourse-common/lib/helpers';
import { renderCategoryTags } from '../lib/utilities';

registerUnbound('discourse-tags', function(topic, params) {
  return new Handlebars.SafeString(renderCategoryTags(topic, params));
});
