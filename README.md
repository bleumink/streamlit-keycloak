# Streamlit Keycloak
**Keycloak user authentication and single sign-on inside your Streamlit app**

## Installation
`pip install streamlit-keycloak`

## Usage
Provide the URL to your Keycloak server, the realm and client and the component will perform the authentication when the app is rendered. First it will attempt to silently authenticate using single sign-on. If this fails, a dialog will appear from which you can open a popup to the Keycloak login page.

When authentication is successful, the component returns a dataclass containing the authentication state, an access token, which can be used to access other restricted resources, a refresh token and a user info object, containing e.g. the username and group memberships. If your configuration provides refresh tokens, the access token can be automatically refreshed when it expires.

So far the component has not been tested in a wide variety of environments. So if you’re also using Keycloak and would benefit from less logging in and easy access to tokens, give this a go and share your experience. Feedback is always welcome.

Frontend authentication like this can only be done with clients that have their access type set to ‘public’ as their is no way to securely provide the client secret from the browser.

## Examples
```python
from dataclasses import asdict
from streamlit_keycloak import login
import streamlit as st


def main():
    st.subheader(f"Welcome {keycloak.user_info['preferred_username']}!")
    st.write(f"Here is your user information:")
    st.write(asdict(keycloak))


st.title("Streamlit Keycloak example")
keycloak = login(
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
)

if keycloak.authenticated:
    main()
```
![streamlit-keycloak showcase|639x663](https://github.com/bleumink/streamlit-keycloak/blob/master/example.gif?raw=true)

By default your access tokens will be refreshed when they expire. Refreshing the tokens will cause your app to be rerendered. If this is not desired, this behaviour can be disabled using the ```auto_refresh``` parameter.

```python
keycloak = login(    
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
    auto_refresh=False
)
```

Depending on your Keycloak configuration, you might want to specify additional parameters to the Keycloak. These can be provided using the ```init_options``` parameter and will be passed to the init function in the frontend. See the [keycloak-js documentation](https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter) for details.

```python
keycloak = login(    
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
    init_options={
        "checkLoginIframe": False
    }
)
```

All text in the login dialog can be customized using the ```custom_labels``` parameter, by providing a dictionary with specific keys set.

```python
keycloak = login(    
    url="http://localhost:8080",
    realm="myrealm",
    client_id="myclient",
    custom_labels={
        "labelButton": "Sign in",
        "labelLogin": "Please sign in to your account.",
        "errorNoPopup": "Unable to open the authentication popup. Allow popups and refresh the page to proceed.",
        "errorPopupClosed": "Authentication popup was closed manually.",
        "errorFatal": "Unable to connect to Keycloak using the current configuration."   
    }
)
```

## Credits
Many thanks to the authors of the [streamlit-auth0](https://github.com/conradbez/streamlit-auth0) and [auth0-spa-js](https://github.com/auth0/auth0-spa-js) packages for inspiring a large part of the approach.

And thanks to 93degree for the [Svelte component template](https://github.com/93degree/streamlit-component-svelte-template), which is awesome.