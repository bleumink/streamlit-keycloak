<script lang="ts">
  import LoginDialog from "./LoginDialog.svelte"

  import { Streamlit, setStreamlitLifecycle } from "./streamlit"
  import { afterUpdate } from "svelte"

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

  const getLoginUrl = (): string => {
    return keycloak.createLoginUrl({
        redirectUri: rewritePage("/login.html"),
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

  afterUpdate(() => {
    Streamlit.setFrameHeight(clientHeight)
  })

  let keycloak: Keycloak
  let clientHeight: number
</script>

<div bind:clientHeight={clientHeight}>
  {#await authenticate() then authenticated}
    {#if !authenticated}
      <LoginDialog 
        loginUrl={getLoginUrl()} 
        on:loggedin={() => {keycloak.login()}}
      />
    {/if}
  {:catch}
    <div class="alert alert-danger">
      <span>Unable to connect to Keycloak using the current configuration.</span>
    </div>
  {/await}
</div>