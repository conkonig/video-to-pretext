declare module '*.css'
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
