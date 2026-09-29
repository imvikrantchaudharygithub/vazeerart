// studio/structure.ts
import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {CogIcon} from '@sanity/icons/Cog'
import {CommentIcon} from '@sanity/icons/Comment'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {HomeIcon} from '@sanity/icons/Home'
import {ImageIcon} from '@sanity/icons/Image'
import {ImagesIcon} from '@sanity/icons/Images'
import {PlayIcon} from '@sanity/icons/Play'
import {UserIcon} from '@sanity/icons/User'
import {VideoIcon} from '@sanity/icons/Video'
import type {SingletonType} from './lib/constants'

function singleton(S: StructureBuilder, type: SingletonType, title: string, icon: React.ComponentType) {
  return S.listItem().title(title).icon(icon).id(type).child(S.document().schemaType(type).documentId(type))
}

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Vazeer Art')
    .items([
      singleton(S, 'siteSettings', 'Site settings', CogIcon),
      singleton(S, 'homePage', 'Home', HomeIcon),
      singleton(S, 'workPage', 'Work & Reels', PlayIcon),
      singleton(S, 'framesPage', 'Frames page', ImagesIcon),
      singleton(S, 'aboutPage', 'About', UserIcon),
      singleton(S, 'contactPage', 'Contact', EnvelopeIcon),
      S.divider(),
      orderableDocumentListDeskItem({type: 'project', title: 'Projects', icon: VideoIcon, S, context}),
      orderableDocumentListDeskItem({type: 'frame', title: 'Frames', icon: ImageIcon, S, context}),
      S.divider(),
      S.listItem()
        .title('Inquiries')
        .icon(CommentIcon)
        .child(
          S.documentTypeList('inquiry')
            .title('Inquiries')
            .defaultOrdering([{field: 'receivedAt', direction: 'desc'}]),
        ),
    ])
