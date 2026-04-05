import { startDevApp } from './dev/app'

const app = document.querySelector<HTMLDivElement>('#app')

if (app === null) {
  throw new Error('app root not found')
}

void startDevApp(app)
