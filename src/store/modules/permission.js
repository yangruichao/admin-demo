// asyncRouterMap,

import { constantRouterMap } from '@/router'
import store from '@/store'
import api from '@/api/api'
import Layout from '@/views/layout/Layout'
import { getIFramePath, getIFrameUrl } from '@/utils/iframe'
// import { AppMain } from '@/views/layout/components'
/**
 * 通过meta.role判断是否与当前用户权限匹配
 * @param roles
 * @param route
 */
// function hasPermission(roles, route) {
//   if (route.meta && route.meta.roles) {
//     return roles.some(role => route.meta.roles.includes(role))
//   } else {
//     return true
//   }
// }

/**
 * 递归过滤异步路由表，返回符合用户角色权限的路由表
 * @param routes asyncRouterMap
 * @param roles
 */
// function filterAsyncRouter(routes, roles) {
//   const res = []

//   routes.forEach(route => {
//     const tmp = { ...route }
//     if (hasPermission(roles, tmp)) {
//       if (tmp.children) {
//         tmp.children = filterAsyncRouter(tmp.children, roles)
//       }
//       res.push(tmp)
//     }
//   })

//   return res
// }

function getMenu(list) {
  var tree = []
  for (var i = 0; i < list.length; i += 1) {
    var n1 = { id: list[i].id,
      name: list[i].name,
      meta: { title: list[i].name, icon: list[i].icon, index: list[i].id },
      children: []
    }

    if (list[i].url === null || list[i].url.length === 0) {
      n1['path'] = 'path' + i
      n1['component'] = Layout
    } else {
      list[i].url = list[i].url.replace(/^\//, '')
      const path = getIFramePath(list[i].url)
      if (path) {
        console.log(path)
        console.log([`@/views/IFrame/IFrame`])
        // 如果是嵌套页面, 通过iframe展示
        n1['path'] = '/' + path
        n1['component'] = resolve => require([`@/views/IFrame/IFrame`], resolve)
        // 存储嵌套页面路由路径和访问URL
        const url = getIFrameUrl(list[i].url)
        const iFrameUrl = { 'path': path, 'url': url }
        store.commit('addIFrameUrl', iFrameUrl)
      } else {
        try {
          // 根据菜单URL动态加载vue组件，这里要求vue组件须按照url路径存储
          // 如url="sys/user"，则组件路径应是"@/views/sys/user.vue",否则组件加载不到
          n1['path'] = '/' + list[i].url
          const array = list[i].url.split('/')
          let url = ''
          for (let i = 0; i < array.length; i++) {
            url += array[i].substring(0, 1).toUpperCase() + array[i].substring(1) + '/'
          }
          url = url.substring(0, url.length - 1)
          n1['component'] = resolve => require([`@/views/${url}`], resolve)
        } catch (e) {
          console.log(1234)
        }
      }
      // n1['path'] = '/' + list[i].url
      // const array = list[i].url.split('/')
      // let url = ''
      // for (let i = 0; i < array.length; i++) {
      //   url += array[i].substring(0, 1).toUpperCase() + array[i].substring(1) + '/'
      // }
      // url = url.substring(0, url.length - 1)
      // n1['component'] = resolve => require([`@/views/${url}`], resolve)
    }

    if (list[i].children && list[i].children.length > 0) {
      var child = getMenu(list[i].children)
      n1.children = child
    }
    if (n1.children && n1.children.length > 0) {
      n1['redirect'] = n1.children[0].path
    }
    tree.push(n1)
  }
  return tree
}

const permission = {
  state: {
    routers: [],
    addRouters: [],
    iframeUrl: [], // 当前嵌套页面路由路径
    iframeUrls: [],
    menuRouteLoaded: false
  },
  mutations: {
    SET_ROUTERS: (state, routers) => {
      // routers.push({ path: '*', redirect: '/404', hidden: true })
      state.addRouters = routers
      state.routers = constantRouterMap.concat(routers)
    },
    setIFrameUrl(state, iframeUrl) { // 设置iframeUrl
      state.iframeUrl = iframeUrl
    },
    addIFrameUrl(state, iframeUrl) { // iframeUrls
      state.iframeUrls.push(iframeUrl)
    },
    menuRouteLoaded(state, menuRouteLoaded) { // 改变菜单和路由的加载状态
      state.menuRouteLoaded = menuRouteLoaded
    }
  },
  actions: {
    GenerateRoutes({ commit }, data) {
      return new Promise(resolve => {
        // console.debug('store.getters.name', store.getters)
        const userName = sessionStorage.getItem('user')

        api.menu.findNavTree({ 'userName': userName }).then(response => {
          var myMenu = getMenu(response.data)
          console.debug('myMenu', myMenu)
          commit('SET_ROUTERS', myMenu)
          commit('menuRouteLoaded', true)
          resolve()
        })
      })
    }
  }
}

export default permission
