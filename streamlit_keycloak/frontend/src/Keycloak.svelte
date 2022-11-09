<script lang="ts">
  import { Streamlit, setStreamlitLifecycle } from "./streamlit"
  import { afterUpdate, onMount } from "svelte"

  import Keycloak from "keycloak-js"
  import type { KeycloakInitOptions } from "keycloak-js"

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

  const createLoginPopup = (): void => {
    if (popup && !popup.closed) {
      popup.focus()
      return
    }
    
    openPopup(
      keycloak.createLoginUrl({
        redirectUri: rewritePage("/login.html"),
      })
    )    
  }

  const openPopup = (url: string): void => {
    const width = 400
    const height = 600
    const left = window.screenX + (window.innerWidth - width) / 2
    const top = window.screenY + (window.innerHeight - height) / 2

    popup = window.open(
      url,
      "keycloak:authorize:popup",
      `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`
    )
  }

  const runPopup = async (): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
      // Throw exception if popup is closed manually
      const popupTimer = setInterval(() => {
        if (popup?.closed) {
          window.removeEventListener("message", popupEventListener, false)
          clearInterval(popupTimer)

          reject(new Error("Authentication popup was closed manually."))
        }
      }, 1000)

      // Wait for postMessage from popup if login is successful
      const popupEventListener = function (event: MessageEvent): void {
        if (event.origin !== window.location.origin) return
        if (!Object.keys(event.data).includes("code")) return

        window.removeEventListener("message", popupEventListener, false)
        clearInterval(popupTimer)

        popup?.close()
        resolve(event.data)
      }

      if (!popup) {
        reject(
          new Error(
            "Unable to open the authentication popup. Allow popups and refresh the page to proceed."
          )
        )
      }

      window.addEventListener("message", popupEventListener)
    })
  }

  const loginWithPopup = async () => {
    await runPopup()
    await keycloak.login()
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

  const authenticate = async (): Promise<boolean> => {
    keycloak = new Keycloak({
      url: url,
      realm: realm,
      clientId: clientId,
    })

    setKeycloakEventListeners(autoRefresh)

    // Check if user is already logged in
    return await keycloak.init({
      ...initOptions,
      onLoad: "check-sso",
      silentCheckSsoRedirectUri: rewritePage("/check-sso.html"),
    })
  }

  afterUpdate(async () => {
    Streamlit.setFrameHeight(200)
  })

  let keycloak: Keycloak
  let popup: Window | null
</script>

{#await authenticate() then authenticated}
  {#if !authenticated}
    <div class="alert alert-warning">
      <button type="button" class="btn btn-primary" on:click={createLoginPopup}>
        <span>Sign in</span>
      </button>
      <span class="mx-3">Please sign in to your account.</span>
      {#if popup}
        {#key popup}
          {#await loginWithPopup() catch error}
            <div class="alert alert-danger mt-3 mb-0">{error.message}</div>
          {/await}
        {/key}
      {/if}
    </div>
  {/if}
{:catch}
  <div class="alert alert-danger">
    <span
      >Unable to authenticate with Keycloak using the current configuration.</span>
  </div>
{/await}
