<script lang="ts">
    import { createEventDispatcher } from "svelte"

    export let loginUrl: string

    const createLoginPopup = (): void => {
        if (currentPopup && !currentPopup.closed) {
            currentPopup.focus()
            return
        }
        
        openPopup(loginUrl)
        showPopup = true
    }

    const openPopup = (url: string): void => {
        const width = 400
        const height = 600
        const left = window.screenX + (window.innerWidth - width) / 2
        const top = window.screenY + (window.innerHeight - height) / 2

        currentPopup = window.open(
            url,
            "keycloak:authorize:popup",
            `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`
        )
    }

  const runPopup = async (popup: Window): Promise<Record<string, string>> => {
    return new Promise((resolve, reject) => {
      // Throw exception if popup is closed manually
      const popupTimer = setInterval(() => {
        if (popup.closed) {
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

        popup.close()
        resolve(event.data)
      }

      window.addEventListener("message", popupEventListener)
    })
  }

  const authenticateWithPopup = async (popup: Window | null): Promise<void> => {
    if (!popup) {
      throw new Error(
        "Unable to open the authentication popup. Allow popups and refresh the page to proceed."
      )        
    }

    await runPopup(popup)
    dispatch("loggedin")
  }

  const dispatch = createEventDispatcher()

  let currentPopup: Window | null
  let showPopup = false
</script>

<div class="alert alert-warning" on:loggedin>
    <button type="button" class="btn btn-primary" on:click={createLoginPopup}>
        <span>Sign in</span>
    </button>
    <span class="mx-3">Please sign in to your account.</span>
    {#if showPopup}
        {#await authenticateWithPopup(currentPopup) catch error}
            <div class="alert alert-danger mt-3 mb-0">{error.message}</div>
        {/await}
    {/if}
</div>
