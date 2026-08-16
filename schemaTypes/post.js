import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    // NEW — editor-written summary shown on cards and as the social/share description.
    // The site auto-derives one from the body when this is blank, so it's optional.
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'One or two lines that sell the click. ~160 characters.',
      validation: (rule) => rule.max(220),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'},
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'photoCredit',
      title: 'Photo credit / caption',
      type: 'string',
      description: 'Who took the photo (shown as a caption under the hero image). ' +
        'Put credits here instead of at the end of the body.',
      validation: (rule) => rule.max(140),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{type: 'reference', to: {type: 'category'}}],
    }),
    defineField({
      name: 'subcategories',
      title: 'Subcategories',
      type: 'array',
      of: [{type: 'reference', to: {type: 'subcategory'}}],
    }),
    // NEW — cross-cutting topics (players, teams, events) for discovery.
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      description: 'e.g. "Virat Kohli", "Asia Cup", "Manchester City"',
    }),
    // NEW — hand-pick the homepage lead story.
    defineField({
      name: 'featured',
      title: 'Featured (Editor’s pick)',
      type: 'boolean',
      initialValue: false,
      description: 'Surface this story in the homepage hero slot.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
  ],

  preview: {
    select: {title: 'title', author: 'author.name', media: 'mainImage'},
    prepare(selection) {
      const {author} = selection
      return {...selection, subtitle: author && `by ${author}`}
    },
  },
})
