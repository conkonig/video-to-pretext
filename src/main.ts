import { mount } from 'svelte'
import App from './App.svelte'
import './app.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (app === null) {
  throw new Error('app root not found')
}

mount(App, { target: app })
