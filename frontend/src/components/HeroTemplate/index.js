export { default as TemplateSingle } from './TemplateSingle';
export { default as TemplateSplit } from './TemplateSplit';
export { default as TemplateCinematic } from './TemplateCinematic';
export { default as TemplateMagazine } from './TemplateMagazine';
export { default as TemplateTicker } from './TemplateTicker';
export { default as TemplateCollage3 } from './TemplateCollage3';
export { default as TemplateCollage4 } from './TemplateCollage4';

import TemplateSingle from './TemplateSingle';
import TemplateSplit from './TemplateSplit';
import TemplateCinematic from './TemplateCinematic';
import TemplateMagazine from './TemplateMagazine';
import TemplateTicker from './TemplateTicker';
import TemplateCollage3 from './TemplateCollage3';
import TemplateCollage4 from './TemplateCollage4';

const TEMPLATE_MAP = {
    'single': TemplateSingle,
    'split': TemplateSplit,
    'cinematic': TemplateCinematic,
    'magazine': TemplateMagazine,
    'ticker': TemplateTicker,
    'collage-3': TemplateCollage3,
    'collage-4': TemplateCollage4,
};

/**
 * Returns the correct Hero template component for a given template_type.
 * Falls back to TemplateSingle if the type is unknown or not provided.
 */
export function getTemplateComponent(templateType) {
    return TEMPLATE_MAP[templateType] ?? TemplateSingle;
}
