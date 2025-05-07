'use client'
// ForwardRefEditor.tsx
import dynamic from 'next/dynamic'
import { forwardRef } from "react"
import { type MDXEditorMethods, type MDXEditorProps} from '@mdxeditor/editor'

// This is the only place InitializedMDXEditor is imported directly.
const _Editor = dynamic(() => import('./pre-editor'), {
  // Make sure we turn SSR off
  ssr: false
})

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
export const Editor = forwardRef<MDXEditorMethods, MDXEditorProps>((props, ref) => <_Editor {...props} editorRef={ref} />)

// TS complains without the following line
Editor.displayName = 'Editor'