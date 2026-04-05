declare module '*.css'
declare module '*.css?inline' {
  const content: string
  export default content
}
declare module '*.svelte' {
  import type { Component } from 'svelte'
  const component: Component<any>
  export default component
}
declare module '*.ttf' {
  const src: string
  export default src
}
declare module '*.mp4' {
  const src: string
  export default src
}
declare module '*?raw' {
  const content: string
  export default content
}
