import { Streamlit, RenderData } from "streamlit-component-lib"
import Keycloak from "keycloak-js"
import type { KeycloakInitOptions } from "keycloak-js"

const rewritePage = (newPage: string): string => {
  return (
    window.location.origin +
    window.location.pathname.replace(/\/[^\/]*$/, newPage)
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
    throw new Error("Unable to open authentication popup")
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

        reject(new Error("Authentication popup was closed"))
      }
    }, 1000)

    // Wait for postMessage from popup if login is successful
    const popupEventListener = function (event: MessageEvent): void {
      if (!Object.keys(event.data).includes("code")) return

      window.removeEventListener("message", popupEventListener, false)
      clearInterval(popupTimer)

      popup.close()
      resolve(event.data)
    }

    window.addEventListener("message", popupEventListener)
  })
}

// Set up the response to Streamlit
const setComponentValue = async (): Promise<void> => {
  if (!keycloak.userInfo) {
    await keycloak.loadUserInfo()
  }

  let value
  if (keycloak.authenticated) {
    value = [true, keycloak.token, keycloak.userInfo]
  } else {
    value = [false, null, null]
  }

  Streamlit.setComponentValue(value)
}

// Set up Keycloak events listeners to send state to Steamlit
const setKeycloakEventListeners = (): void => {
  keycloak.onAuthError = async () => await setComponentValue()
  keycloak.onAuthRefreshError = async () => await setComponentValue()
  keycloak.onAuthSuccess = async () => await setComponentValue()
  keycloak.onAuthRefreshSuccess = async () => await setComponentValue()
}

const authenticate = async (
  url: string,
  realm: string,
  clientId: string,
  initOptions: KeycloakInitOptions = {}
): Promise<void> => {
  keycloak = new Keycloak({
    url: url,
    realm: realm,
    clientId: clientId,
  })

  setKeycloakEventListeners()

  // Check if user is already logged in
  let authenticated = await keycloak.init({
    ...initOptions,
    onLoad: "check-sso",
    silentCheckSsoRedirectUri: rewritePage("/check-sso.html"),
  })

  if (!authenticated) {
    // If not authenticated, open the popup and have it set cookies
    const loginUrl = keycloak.createLoginUrl({
      redirectUri: rewritePage("/login.html"),
    })

    const popup = openPopup(loginUrl)
    await runPopup(popup)
    await keycloak.login()
  }

  // Check every 15 seconds if token is within 30 seconds of expiring
  if (keycloak.refreshToken) {
    setInterval(() => {
      keycloak.updateToken(30)
    }, 15000)
  }
}

/**
 * The component's render function. This will be called immediately after
 * the component is initially loaded, and then again every time the
 * component gets new data from Python.
 */
const onRender = (event: Event): void => {
  if (keycloak?.authenticated) return

  const data = (event as CustomEvent<RenderData>).detail
  const { url, realm, clientId, initOptions } = data.args

  authenticate(url, realm, clientId, initOptions)
}

let keycloak: Keycloak

// Attach our `onRender` handler to Streamlit's render event.
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)

// Tell Streamlit we're ready to start receiving data. We won't get our
// first RENDER_EVENT until we call this function.
Streamlit.setComponentReady()

// Finally, tell Streamlit to update our initial height. We omit the
// `height` parameter here to have it default to our scrollHeight.
Streamlit.setFrameHeight()
