<script lang="ts">
  import { Streamlit, setStreamlitLifecycle } from "./streamlit"
  import { onMount } from "svelte"  

  import Keycloak from "keycloak-js"
  import type {KeycloakInitOptions} from "keycloak-js"
  
  setStreamlitLifecycle()

  export let url: string
  export let realm: string
  export let clientId: string
  export let autoRefresh: boolean = true
  export let initOptions: KeycloakInitOptions = {}

  const rewritePage = (newPage: string): string => {
    return (
      window.location.origin +
      window.location.pathname.replace(/\/[^/]*$/, newPage)
    )
  }

  const openPopup = (url: string): Window => {
    const width = 400
    const height = 600
    const left = window.screenX + (window.innerWidth - width) / 2
    const top = window.screenY + (window.innerHeight - height) / 2

    const popup = window.open(
      url,
      "keycloak:authorize:popup",
      `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`
    )

    if (!popup) {
      throw new Error("Unable to open authentication popup. Popups must be allowed to log in.")
    }

    return popup
  }

  const runPopup = async (popup: Window): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
      // Throw exception if popup is closed manually
      const popupTimer = setInterval(() => {
        if (popup.closed) {
          window.removeEventListener("message", popupEventListener, false)
          clearInterval(popupTimer)
          clearTimeout(timeoutId)

          reject(new Error("Authentication popup was closed manually."))
        }
      }, 1000)

      const timeoutId = setTimeout(() => {
        window.removeEventListener("message", popupEventListener, false)
        clearInterval(popupTimer)

        reject(new Error("Login took too long. Refresh the page to try again."))
      }, 300_000)

      // Wait for postMessage from popup if login is successful
      const popupEventListener = function (event: MessageEvent): void {
        if (event.origin !== window.location.origin) return
        if (!Object.keys(event.data).includes("code")) return

        window.removeEventListener("message", popupEventListener, false)
        clearInterval(popupTimer)
        clearTimeout(timeoutId)

        popup.close()
        resolve(event.data)
      }

      window.addEventListener("message", popupEventListener)
    })
  }

  // Set up the response to Streamlit
  const setComponentValue = async (): Promise<void> => {
    if (!keycloak.userInfo && keycloak.authenticated) {
      await keycloak.loadUserInfo()
    }

    let value
    if (keycloak.authenticated) {
      value = {
        authenticated: true,
        access_token: keycloak.token,
        refresh_token: keycloak.refreshToken,
        user_info: keycloak.userInfo,
      }
    } else {
      value = { authenticated: false }
    }

    Streamlit.setComponentValue(value)
  }

  // Set up Keycloak events listeners to send state to Steamlit
  const setKeycloakEventListeners = (autoRefresh: boolean): void => {
    keycloak.onAuthError = async () => await setComponentValue()
    keycloak.onAuthRefreshError = async () => await setComponentValue()
    keycloak.onAuthSuccess = async () => await setComponentValue()
    keycloak.onAuthRefreshSuccess = async () => await setComponentValue()
    keycloak.onTokenExpired = async () => {
      if (!autoRefresh || !keycloak.refreshToken) return
      await keycloak.updateToken(10)
    }
  }

  const loginWithPopup = async () => {
    // If not authenticated, open the popup and have it set cookies
    const loginUrl = keycloak.createLoginUrl({
      redirectUri: rewritePage("/login.html"),
    })

    const popup = openPopup(loginUrl)
    await runPopup(popup)
    await keycloak.login()
  }

  onMount(async () => {
    keycloak = new Keycloak({
      url: url,
      realm: realm,
      clientId: clientId,
    })

    setKeycloakEventListeners(autoRefresh)

    // Check if user is already logged in
    authenticated = await keycloak.init({
      ...initOptions,
      onLoad: "check-sso",
      silentCheckSsoRedirectUri: rewritePage("/check-sso.html"),
    })    

    initialized = true
  })
  
  let keycloak: Keycloak
  let authenticated = false
  let initialized = false    
</script>

{#if initialized && !authenticated}
  {#await loginWithPopup()}    
  <div class="alert alert-primary">Please provide credentials to log in.</div>    
  {:catch error}
    <div class="alert alert-danger">{error.message}</div>    
  {/await}  
{/if}
