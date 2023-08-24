import {createApp} from 'vue'
import App from "./App.vue"
import {createRouter, createWebHistory, RouteRecordRaw} from "vue-router";

const routes: RouteRecordRaw[] = [
    {
        path: '/01',
        component: () => import('./views/Example01Basic.vue')
    },
    {
        path: '/02',
        component: () => import('./views/Example02Events.vue')
    },
    {
        path: '/03',
        component: () => import('./views/ExampleAll.vue')
    }
]

const router = createRouter({
    routes,
    history: createWebHistory()
})

createApp(App).use(router).mount('#app')
